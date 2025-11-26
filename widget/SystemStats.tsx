import { Gtk } from "ags/gtk4"
import { exec } from "ags/process"
import { createState } from "ags"
import { interval } from "ags/time"
import Glib, { GLib } from "gi://GLib?version=2.0"
import Gio from "gi://Gio?version=2.0"

function readFile(path: string): string {
  try {
    const [ok, data] = Glib.file_get_contents(path)
    if (ok) {
      return new TextDecoder().decode(data)
    }
  } catch (e) {
    console.error(`Failed to read ${path}:`, e)
  }
  return ""
}

interface Stats {
  cpuPercent: number
  memPercent: number
  diskPercent: number
  cpuTemp: number
}

// Store previous CPU ticks to calculate the delta
let prevTotal = 0
let prevIdle = 0

function getStats(): Stats {
  let cpuPercent = 0
  let memPercent = 0
  let diskPercent = 0
  let cpuTemp = 0

  // 1. CPU Usage (Parse /proc/stat)
  const cpuData = readFile("/proc/stat").split("\n")[0]
  if (cpuData) {
    // The standard order is user, nice, system, idle, iowait, irq, softirq
    const parts = cpuData.split(/\s+/).slice(1) // Skip the 'cpu' label
    const user = parseInt(parts[0]) || 0
    const nice = parseInt(parts[1]) || 0
    const system = parseInt(parts[2]) || 0
    const idle = parseInt(parts[3]) || 0
    const iowait = parseInt(parts[4]) || 0
    const irq = parseInt(parts[5]) || 0
    const softirq = parseInt(parts[6]) || 0

    const currentTotal = user + nice + system + idle + iowait + irq + softirq
    const currentIdle = idle + iowait

    const deltaTotal = currentTotal - prevTotal
    const deltaIdle = currentIdle - prevIdle

    if (deltaTotal > 0) {
      cpuPercent = ((deltaTotal - deltaIdle) / deltaTotal) * 100
    }

    prevTotal = currentTotal
    prevIdle = currentIdle
  }

  // 2. Memory Usage (Parse /proc/meminfo)
  const memData = readFile("/proc/meminfo")
  if (memData) {
    const totalMatch = memData.match(/MemTotal:\s+(\d+)/)
    const availableMatch = memData.match(/MemAvailable:\s+(\d+)/)
    
    if (totalMatch && availableMatch) {
      const total = parseInt(totalMatch[1])
      const available = parseInt(availableMatch[1])
      memPercent = ((total - available) / total) * 100
    }
  }

  // 3. Disk Usage (use Glib/Gio to get disk usage)
  try {
    const file = Gio.File.new_for_path("/")
    const info = file.query_filesystem_info("filesystem::size,filesystem::used", null)
    const size = info.get_attribute_uint64("filesystem::size")
    const used = info.get_attribute_uint64("filesystem::used")
    if (size > 0) {
      diskPercent = (Number(used) / Number(size)) * 100
    }
  } catch (e) {
    // Fallback or ignore
  }

  // lets just use the hwmon directly
  const tempPath = "/sys/class/thermal/thermal_zone3/temp"
  const tempData = readFile(tempPath).trim()
  if (tempData) {
    cpuTemp = parseInt(tempData) / 1000 // Convert millidegree to degree
  }

  return { cpuPercent, memPercent, diskPercent, cpuTemp }
  
}


export function SystemStatsWidget() {
  const [stats, setStats] = createState<Stats>({
    cpuPercent: 0,
    memPercent: 0,
    diskPercent: 0,
    cpuTemp: 0
  })

  // Update stats every 2 seconds
  interval(2000, () => {
    setStats(getStats())
  })

  // Initial update
  setStats(getStats())

  const box = (
    <box cssClasses={["system-stats"]} spacing={12}>
      <box spacing={4}>
        <label cssClasses={["stat-icon"]} label="" />
        <label
          label={stats.as(
            (s) => `${s.cpuPercent.toFixed(0)}%`
          )}
        />
        <label cssClasses={["stat-icon"]} label="" />
        <label
          label={stats.as(
            (s) => `${s.cpuTemp.toFixed(0)}°C`
          )}
        />
      </box>
      <box spacing={4}>
        <label cssClasses={["stat-icon"]} label="" />
        <label label={stats.as((s) => `${s.memPercent.toFixed(0)}%`)} />
      </box>
      <box spacing={4}>
        <label cssClasses={["stat-icon"]} label="" />
        <label label={stats.as((s) => `${s.diskPercent.toFixed(0)}%`)} />
      </box>
    </box>
  ) as Gtk.Box

  return box
}
