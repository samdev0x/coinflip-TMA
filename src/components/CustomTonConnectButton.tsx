// CustomTonConnectButton.tsx
import React from 'react';
import { Button } from 'pixel-retroui';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toUserFriendlyAddress } from '@tonconnect/sdk';

const CustomTonConnectButton: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const handleConnect = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  const getUserFriendlyAddress = (address: string) => {
    return toUserFriendlyAddress(address);
  };

  const getShortAddress = (address: string) => {
    const userFriendlyAddress = getUserFriendlyAddress(address);
    return userFriendlyAddress.slice(0, 6) + '...' + userFriendlyAddress.slice(-4);
  };

  return (
    <Button
      bg="#1AC9FF"
      textColor="black"
      borderColor="black"
      shadow="#2D83EC"
      onClick={tonConnectUI.connected ? handleDisconnect : handleConnect}
      className="flex items-center justify-center"
    >
      {tonConnectUI.connected && wallet ? (
        <span>{getShortAddress(wallet.account.address)}</span>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
};

export default CustomTonConnectButton;
