export function SimulateButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9999] rounded-full bg-[#6c63ff] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_#6c63ff] outline-none"
    >
      Simulate
    </button>
  )
}
