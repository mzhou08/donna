import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/clerk-react";
import {
  Authenticated,
  Unauthenticated,
  useAction,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { Header } from "@/components/Header.tsx";
import { useEffect, useState } from "react";

export default function App() {
  return (
    <main className="container max-w-2xl flex flex-col gap-8">
      <Header />
      <Authenticated>
        <SignedIn />
      </Authenticated>
      <Unauthenticated>
        <div className="flex justify-center">
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </Unauthenticated>
    </main>
  );
}

function SignedIn() {
  const { user } = useUser();
  const [ saved, setSaved ] = useState(false);
  const addUser = useAction(api.functions.addUser);

  const name = user?.fullName || "Anonymous";
  const email = user?.emailAddresses[0].emailAddress || "Unknown";
  const phone = user?.phoneNumbers[0].phoneNumber || "Unknown";
  const userData = useQuery(api.functions.checkUser, { phone: phone || "" })?.userData;

  useEffect(() => {
    if (user) {
      const id = user.id;

      if (!userData) {
        void addUser({
          id,
          name,
          email,
          phone,
        });
        setSaved(true);
      } else {
        setSaved(true);
      }
    }
  }, [user]);

  return (
    saved ? (
      <>
        <h1 className="text-2xl font-bold">Welcome back, {name}!</h1>
        <p className="text-gray-500">Your email address is {email}</p>
        <p className="text-gray-500">Your phone number is {phone}.</p>
      </>
    ) : (
      <>
        <p>We are still loading your data...</p>
      </>
    )
  );
}