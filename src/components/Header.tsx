// src/components/Header.tsx
import { UserButton } from "@clerk/clerk-react";

export function Header() {
  return (
    <header className="w-full flex justify-between items-center p-4 bg-gray-100">
      <div className="text-xl font-bold text-black">donna</div>
      <UserButton afterSignOutUrl="#" />
    </header>
  );
}