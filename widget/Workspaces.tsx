import { createBinding } from "ags"
import { execAsync } from "ags/process"
import { Gtk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"

export function Workspaces() {
  const hyprland = Hyprland.get_default()
  const workspaces = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <box cssClasses={["island", "workspaces"]}>
      <button
        cssClasses={["launcher"]}
        onClicked={() => execAsync("rofi -show drun")}
      >
        <label label="󱓟" />
      </button>
      {workspaces.map((id) => (
        <button
          cssClasses={createBinding(hyprland, "focusedWorkspace").as(
            (ws) => ws?.get_id() === id ? ["workspace", "active"] : ["workspace"]
          )}
          onClicked={() => execAsync(`hyprctl dispatch workspace ${id}`)}
        >
          <Gtk.Image
            file={createBinding(hyprland, "focusedWorkspace").as(
              (ws) => ws?.get_id() === id
                ? "/home/adam/repos/futilebar/assets/diamond-active.svg"
                : "/home/adam/repos/futilebar/assets/diamond-inactive.svg"
            )}
          />
        </button>
      ))}
    </box>
  )
}
