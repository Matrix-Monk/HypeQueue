"use client"

import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const Appbar = () => {
  const { data: session, status } = useSession();
   const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin"); // Redirect if not logged in
    }
  }, [status, router]);


  if (status === "loading") return <p>Loading...</p>;
  
  

  return (
    <div>
      {session?.user && <button onClick={() => signOut({callbackUrl: "/"})}>signOut</button>}
      {!session?.user && <button onClick={() => signIn()}>signIn</button>}

      <div>{session?.user?.email}</div>
    </div>
  );
}

export default Appbar
