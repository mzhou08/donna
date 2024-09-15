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
import React, { useState } from "react";

export default function App() {
  return (
    <>
      <Header/>
      <main className="container max-w-2xl flex flex-col gap-8 mt-10">
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
    </>
  );
}

function SignedIn() {
  const { user } = useUser();
  const [telegramUsername, setTelegramUsername] = useState("");
  const addUser = useAction(api.functions.addUser);

  const name = user?.fullName || "Anonymous";
  const email = user?.emailAddresses[0].emailAddress || "Unknown";
  const phone = user?.phoneNumbers[0].phoneNumber || "Unknown";
  const userData = useQuery(api.functions.getUserById, { id: user?.id || "" })?.userData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the submission of the telegram username
    if (user?.id) {
      setTelegramUsername("");

      void addUser({
        id: user.id,
        name,
        email,
        phone: telegramUsername,  // to simulate phone number
      });
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back, {name}!</h1>
      <p className="text-gray-500">Your email address is {email}</p>
      <p className="text-gray-500">Your phone number is {phone}.</p>
      {!userData ? (
        <form onSubmit={handleSubmit}>
          <label>
            Telegram Username:
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              className="border p-2 ml-5 mr-5 rounded-md text-gray-800"
            />
          </label>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </form>
      ) : <p className="text-gray-500">Your telegram handle is {userData.phone}.</p>}
    </>
  );
}