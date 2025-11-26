import Cava from "gi://AstalCava"
import { Gtk } from "ags/gtk4"

export function CavaWidget() {
  const cava = Cava.get_default()
  const box = <box cssClasses={["island", "cava-widget"]} spacing={2} /> as Gtk.Box

  const updateBars = () => {
    // Remove all children
    let child = box.get_first_child()
    while (child) {
      const next = child.get_next_sibling()
      box.remove(child)
      child = next
    }

    const values = cava?.get_values() || []
    
    // Add bars based on current values
    values.forEach((value) => {
      const levelbar = Gtk.LevelBar.new()
      levelbar.set_css_classes(["cava-bar"])
      levelbar.set_orientation(Gtk.Orientation.VERTICAL)
      levelbar.set_inverted(true)
      levelbar.set_min_value(0)
      levelbar.set_max_value(1)
      levelbar.set_value(value)
      box.append(levelbar)
    })
  }

  // Initial render
  updateBars()

  // Update when values change
  cava?.connect("notify::values", updateBars)

  return box
}
