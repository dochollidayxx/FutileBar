import { Gtk } from "ags/gtk4"
import Tray from "gi://AstalTray"
import { exec } from "ags/process"

// Try to find an icon for a broken tray item by hunting down the process
function findIconForBrokenItem(itemId: string): string | null {
  try {
    // Extract the DBus address (e.g., ":1.332" from ":1.332/")
    const dbusAddress = itemId.split("/")[0]

    // Get PID from busctl
    let pid = ""
    try {
      const busctlOut = exec(`busctl --user status ${dbusAddress}`)
      const lines = busctlOut.split("\n")
      for (const line of lines) {
        if (line.startsWith("PID=")) {
          pid = line.split("=")[1].trim()
          break
        }
      }
    } catch (e) {
      return null
    }

    if (!pid) return null

    // Get the process name
    let procName = ""
    try {
      procName = exec(`cat /proc/${pid}/comm`).trim()
    } catch (e) {
      return null
    }

    if (!procName) return null

    // Try common icon locations
    const homeDir = exec("echo $HOME").trim()
    const iconLocations = [
      `/usr/share/pixmaps/${procName}.png`,
      `/usr/share/pixmaps/${procName}.svg`,
      `/usr/share/icons/hicolor/scalable/apps/${procName}.svg`,
      `/usr/share/icons/hicolor/256x256/apps/${procName}.png`,
      `/usr/share/icons/hicolor/128x128/apps/${procName}.png`,
      `/usr/share/icons/hicolor/48x48/apps/${procName}.png`,
      `${homeDir}/.local/share/icons/hicolor/scalable/apps/${procName}.svg`,
      `${homeDir}/.local/share/icons/hicolor/256x256/apps/${procName}.png`,
    ]

    for (const iconPath of iconLocations) {
      try {
        const testResult = exec(`test -f "${iconPath}" && echo 1 || echo 0`)
        if (testResult.trim() === "1") {
          return iconPath
        }
      } catch (e) {
        // Continue to next location
      }
    }

    // Try using the process name as an icon name (let GTK search for it)
    return procName
  } catch (e) {
    return null
  }
}

function TrayItem(item: Tray.TrayItem) {
  const img = Gtk.Image.new()
  img.set_pixel_size(16)

  const updateIcon = () => {
    const gicon = item.get_gicon()
    const iconPixbuf = item.get_icon_pixbuf()
    const iconName = item.get_icon_name()
    const tooltip = item.get_tooltip()
    const itemId = item.get_item_id()

    if (gicon) {
      img.set_from_gicon(gicon)
    } else if (iconPixbuf) {
      img.set_from_pixbuf(iconPixbuf)
    } else if (iconName) {
      img.set_from_icon_name(iconName)
    } else if (tooltip?.icon_name) {
      img.set_from_icon_name(tooltip.icon_name)
    } else {
      // Broken tray item - try to hunt down the icon by process
      const foundIcon = findIconForBrokenItem(itemId)

      if (foundIcon) {
        if (foundIcon.startsWith("/")) {
          img.set_from_file(foundIcon)
        } else {
          img.set_from_icon_name(foundIcon)
        }
      }
    }
  }

  // Check if this item has a menu
  const menuModel = item.get_menu_model()
  const actionGroup = item.get_action_group()
  const isMenu = item.get_is_menu()

  if (menuModel && actionGroup) {
    // Use MenuButton for items with menus - it handles menu display automatically
    const menuBtn = Gtk.MenuButton.new()
    menuBtn.set_css_classes(["tray-item"])
    menuBtn.set_tooltip_markup(item.get_tooltip_markup())
    menuBtn.set_child(img)
    menuBtn.set_menu_model(menuModel)

    // Insert the action group with "dbusmenu" prefix
    menuBtn.insert_action_group("dbusmenu", actionGroup)

    // Create and style the popover
    const popover = Gtk.PopoverMenu.new_from_model(menuModel)
    popover.set_css_classes(["tray-menu"])
    menuBtn.set_popover(popover)

    // Update icon when the tray item is ready/changes
    item.connect("ready", updateIcon)
    item.connect("changed", updateIcon)
    updateIcon()

    // Update tooltip when it changes
    item.connect("notify::tooltip-markup", () => {
      menuBtn.set_tooltip_markup(item.get_tooltip_markup())
    })

    return menuBtn
  } else if (isMenu) {
    // Items that claim to have a menu but don't expose it properly (Chromium apps)
    // Create a manual fallback menu
    const menuBtn = Gtk.MenuButton.new()
    menuBtn.set_css_classes(["tray-item"])
    menuBtn.set_tooltip_markup(item.get_tooltip_markup())
    menuBtn.set_child(img)

    // Get the process name for the "Open" command
    const itemId = item.get_item_id()
    const dbusAddress = itemId.split("/")[0]
    let procName = ""
    try {
      const busctlOut = exec(`busctl --user status ${dbusAddress}`)
      const lines = busctlOut.split("\n")
      let pid = ""
      for (const line of lines) {
        if (line.startsWith("PID=")) {
          pid = line.split("=")[1].trim()
          break
        }
      }
      if (pid) {
        procName = exec(`cat /proc/${pid}/comm`).trim()
      }
    } catch (e) {
      // Fallback
    }

    // Create manual menu
    const popover = Gtk.Popover.new()
    popover.set_css_classes(["tray-menu"])

    const menuBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)

    const openBtn = Gtk.Button.new()
    openBtn.set_css_classes(["tray-menu-item"])
    const openBox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 0)
    const openIcon = Gtk.Label.new("󰏌")
    openIcon.set_css_classes(["power-icon"])
    const openLabel = Gtk.Label.new("Open")
    openBox.append(openIcon)
    openBox.append(openLabel)
    openBtn.set_child(openBox)
    openBtn.connect("clicked", () => {
      if (procName) {
        exec(`${procName} &`)
      }
      popover.popdown()
    })

    const quitBtn = Gtk.Button.new()
    quitBtn.set_css_classes(["tray-menu-item"])
    const quitBox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 0)
    const quitIcon = Gtk.Label.new("")
    quitIcon.set_css_classes(["power-icon"])
    const quitLabel = Gtk.Label.new("Quit")
    quitBox.append(quitIcon)
    quitBox.append(quitLabel)
    quitBtn.set_child(quitBox)
    quitBtn.connect("clicked", () => {
      item.activate(0, 0)
      popover.popdown()
    })

    menuBox.append(openBtn)
    menuBox.append(quitBtn)
    popover.set_child(menuBox)
    menuBtn.set_popover(popover)

    // Update icon when the tray item is ready/changes
    item.connect("ready", updateIcon)
    item.connect("changed", updateIcon)
    updateIcon()

    // Update tooltip when it changes
    item.connect("notify::tooltip-markup", () => {
      menuBtn.set_tooltip_markup(item.get_tooltip_markup())
    })

    return menuBtn
  } else {
    // Use regular button for items without menus
    const btn = Gtk.Button.new()
    btn.set_css_classes(["tray-item"])
    btn.set_tooltip_markup(item.get_tooltip_markup())
    btn.set_child(img)

    btn.connect("clicked", () => item.activate(2, 2))

    // Update icon when the tray item is ready/changes
    item.connect("ready", updateIcon)
    item.connect("changed", updateIcon)
    updateIcon()

    // Update tooltip when it changes
    item.connect("notify::tooltip-markup", () => {
      btn.set_tooltip_markup(item.get_tooltip_markup())
    })

    // Right click support
    const gestureClick = Gtk.GestureClick.new()
    gestureClick.set_button(3)
    gestureClick.connect("released", () => {
      item.secondary_activate(0, 0)
    })
    btn.add_controller(gestureClick)

    return btn
  }
}

export function TrayWidget() {
  const tray = Tray.get_default()

  const box = <box cssClasses={["tray"]} /> as Gtk.Box

  const updateItems = () => {
    // Remove all children
    let child = box.get_first_child()
    while (child) {
      const next = child.get_next_sibling()
      box.remove(child)
      child = next
    }

    const items = tray.get_items()

    // Hide box if no items
    box.set_visible(items.length > 0)

    // Add current items (we'll try to find icons even for broken ones)
    items.forEach((item) => {
      box.append(TrayItem(item))
    })
  }

  // Initial render
  updateItems()

  // Update when items change
  tray.connect("notify::items", updateItems)

  return box
}
