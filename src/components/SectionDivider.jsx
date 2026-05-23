// SectionDivider — labeled horizontal rule for form sections
export default function SectionDivider({ label }) {
  return (
    <div className="ds-section-divider">
      <span className="ds-section-divider__label">{label}</span>
      <span className="ds-section-divider__line" />
    </div>
  )
}
