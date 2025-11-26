import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { useWindowTitle } from "./useWindowTitle"
import { Workspaces } from "./Workspaces"
import { PowerMenu } from "./PowerMenu"
import { TrayWidget } from "./Tray"
import { SystemStatsWidget } from "./SystemStats"
import { CavaWidget } from "./Cava"
import { execAsync } from "ags/process"
import Bluetooth from "gi://AstalBluetooth"
import Wp from "gi://AstalWp"
import Tray from "gi://AstalTray"
import { createBinding, createState } from "ags"
import { interval } from "ags/time"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  const windowTitle = useWindowTitle()
  const bluetooth = Bluetooth.get_default()
  const audio = Wp.get_default()?.audio
  const speaker = audio?.defaultSpeaker
  const tray = Tray.get_default()

  const formatTime = () => {
    const now = new Date()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = days[now.getDay()]
    const date = now.getDate()
    const month = months[now.getMonth()]
    let hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${day} ${date} ${month} ${hours}:${minutes}${ampm}`
  }

  const [time, setTime] = createState(formatTime())

  interval(1000, () => {
    setTime(formatTime())
  })

  const startWidget = (
    <box spacing={8}>
      <Workspaces />
      <CavaWidget />
    </box>
  )

  const centerWidget = (
    <box
      cssClasses={["island", "window-title"]}
      visible={windowTitle.as(title => title !== "")}
    >
      <label label={windowTitle} />
    </box>
  )

  const endWidget = (
    <box cssClasses={["island"]}>
      <label label={time} cssClasses={["time-label"]} />
      <button
        cssClasses={["sound-button"]}
        onClicked={() => execAsync("pwvucontrol")}
      >
        <label
          label={
            speaker
              ? createBinding(speaker, "volume").as((volume) => {
                  const muted = speaker.get_mute()
                  if (muted) return "󰖁"
                  if (volume === 0) return "󰕿"
                  if (volume < 0.33) return "󰖀"
                  if (volume < 0.66) return "󰕾"
                  return "󰕾"
                })
              : "󰕾"
          }
        />
      </button>
      <button
        cssClasses={["bluetooth-button"]}
        onClicked={() => execAsync("overskride")}
      >
        <label
          label={createBinding(bluetooth, "isConnected").as((connected) =>
            connected ? "" : "󰂯"
          )}
        />
      </button>
      <PowerMenu />
    </box>
  )

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox
        startWidget={startWidget}
        centerWidget={centerWidget}
        endWidget={
          <box spacing={8}>
            <box cssClasses={["island"]}>
              <SystemStatsWidget />
            </box>
            <box
              cssClasses={["island"]}
              visible={createBinding(tray, "items").as(
                (items) => items.length > 0
              )}
            >
              <TrayWidget />
            </box>
            {endWidget}
          </box>
        }
      />
    </window>
  )
}
