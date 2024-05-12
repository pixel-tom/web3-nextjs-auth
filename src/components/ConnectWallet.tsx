import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { SigninMessage } from "./../utils/signinMessage";
import bs58 from "bs58";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ConnectWallet() {
  const { data: session, status } = useSession();

  const wallet = useWallet();
  const walletModal = useWalletModal();

  const handleSignIn = async () => {
    try {
      if (!wallet.connected) {
        walletModal.setVisible(true);
      }

      const csrf = await getCsrfToken();
      if (!wallet.publicKey || !csrf || !wallet.signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `Sign message to authenticate with FOMOBET : `,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await wallet.signMessage(data);
      const serializedSignature = bs58.encode(signature);

      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (wallet.connected && status == "unauthenticated") {
      handleSignIn();
    }
  }, [wallet.connected]);

  return (
    <div className="items-cente flex flex-row gap-5">
      {!session && <Button onClick={handleSignIn}>Connect Wallet</Button>}

      {session?.user && (
        <>
          <Button
            onClick={async (e) => {
              try {
                e.preventDefault();
                await wallet.disconnect();
                await signOut();
              } catch (e) {
                console.log(e);
              }
            }}
          >
            {wallet.publicKey
              ? obfuscatePubKey(wallet.publicKey.toBase58())
              : "signing out .."}
          </Button>
        </>
      )}
    </div>
  );
}

export const obfuscatePubKey = (address: string) => {
  return (
    address?.substring(0, 4) + ".." + address.substring(address.length - 4)
  );
};
