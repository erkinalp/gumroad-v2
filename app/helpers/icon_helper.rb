# frozen_string_literal: true

module IconHelper
  # For icon values see app/assets/images/icons folder

  ICON_CLASSES = JSON.parse(File.read(Rails.root.join("app/javascript/data/icons.json")))

  def icon(name, options = {})
    classes = [
      "inline-block min-h-[max(1lh,1em)] w-[1em] shrink-0 bg-current [mask-size:120%] [mask-position:center] [mask-repeat:no-repeat]",
      "after:content-['\\00a0']",
      ICON_CLASSES[name],
      options[:class]
    ]

    tag.span(nil, **options.merge(class: classes))
  end

  def icon_yes
    icon("solid-check-circle", aria: { label: "Yes" }, style: "color: rgb(var(--success))")
  end

  def icon_no
    icon("x-circle-fill", aria: { label: "No" }, style: "color: rgb(var(--danger))")
  end
end
