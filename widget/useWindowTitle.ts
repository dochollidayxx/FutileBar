import Hyprland from "gi://AstalHyprland"
import { createState, type Accessor } from "ags"

/**
 * Creates a reactive accessor that tracks the title of the currently focused window
 * and updates in real-time when the title changes (e.g., tab changes in VSCode)
 */
export function useWindowTitle(): Accessor<string> {
  const hyprland = Hyprland.get_default()
  const [titleAccessor, setTitle] = createState<string>("")

  let currentClientConnection: number | null = null
  let currentClient: Hyprland.Client | null = null

  function updateTitle(client: Hyprland.Client | null) {
    // Clean up previous title subscription
    if (currentClientConnection !== null && currentClient !== null) {
      currentClient.disconnect(currentClientConnection)
      currentClientConnection = null
      currentClient = null
    }

    if (!client) {
      setTitle("")
      return
    }

    // Set initial title
    setTitle(client.get_title() || "")

    // Subscribe to title changes on this client
    currentClient = client
    currentClientConnection = client.connect("notify::title", () => {
      setTitle(client.get_title() || "")
    })
  }

  // Watch for focused client changes
  hyprland.connect("notify::focused-client", () => {
    updateTitle(hyprland.get_focused_client())
  })

  // Initialize with current focused client
  updateTitle(hyprland.get_focused_client())

  return titleAccessor
}
