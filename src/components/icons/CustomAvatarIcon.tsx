export function CustomAvatarIcon({ className }: { className?: string }) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 transition-colors">
        <svg
          className={className || "h-5 w-5 text-white"}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }