"use client";

import { useState } from "react";
import { categories } from "@/lib/format";

type CategorySelectProps = {
  selectName?: string;
  customName?: string;
  className?: string;
  includeAll?: boolean;
  initialValue?: string;
  onCategoryChange?: (category: string) => void;
};

export function CategorySelect({
  selectName = "category",
  customName = "customCategory",
  className = "",
  includeAll = false,
  initialValue = "",
  onCategoryChange
}: CategorySelectProps) {
  const [value, setValue] = useState(initialValue || (includeAll ? "" : categories[0]));
  const [customValue, setCustomValue] = useState("");
  const isOther = value === "Other";

  function updateValue(nextValue: string) {
    setValue(nextValue);
    onCategoryChange?.(nextValue === "Other" ? customValue : nextValue);
  }

  function updateCustom(nextValue: string) {
    setCustomValue(nextValue);
    onCategoryChange?.(nextValue);
  }

  return (
    <div className={className}>
      <select name={selectName} value={value} onChange={(event) => updateValue(event.target.value)} className="field">
        {includeAll ? <option value="">All categories</option> : null}
        {categories.map((category) => (
          <option key={category}>{category}</option>
        ))}
        <option>Other</option>
      </select>
      {isOther ? (
        <input
          name={customName}
          value={customValue}
          onChange={(event) => updateCustom(event.target.value)}
          placeholder="Type your category"
          className="field mt-3"
          required
        />
      ) : null}
    </div>
  );
}

export function getSubmittedCategory(formData: FormData) {
  const selected = String(formData.get("category") || "");
  const custom = String(formData.get("customCategory") || "").trim();
  return selected === "Other" ? custom : selected;
}
