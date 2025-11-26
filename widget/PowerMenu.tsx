import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

export function PowerMenu() {
  const powerOptions = [
    { label: "Shutdown", icon: "", command: "systemctl poweroff" },
    { label: "Reboot", icon: "󰜉", command: "systemctl reboot" },
    { label: "Suspend", icon: "󰤄", command: "systemctl suspend" },
    { label: "Lock", icon: "", command: "hyprlock" },
    { label: "Logout", icon: "󰍃", command: "hyprctl dispatch exit" },
  ]

  return (
    <Gtk.MenuButton cssClasses={["power-menu"]}>
      <label label="" />
      <Gtk.Popover cssClasses={["power-menu-popup"]}>
        <box orientation={Gtk.Orientation.VERTICAL}>
          {powerOptions.map((option) => (
            <button
              cssClasses={["power-option"]}
              onClicked={() => execAsync(option.command)}
            >
              <box>
                <label label={option.icon} cssClasses={["power-icon"]} />
                <label label={option.label} cssClasses={["power-label"]} />
              </box>
            </button>
          ))}
        </box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  )
}
