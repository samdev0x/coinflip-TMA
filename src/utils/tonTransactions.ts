import { TonConnectUI } from '@tonconnect/ui-react';

export const sendTransaction = async (tonConnectUI: TonConnectUI, transaction: any) => {
  try {
    const result = await tonConnectUI.sendTransaction(transaction, {
      modals: ['before', 'success', 'error'],
      notifications: ['before', 'success', 'error'],
    });
    return result;
  } catch (error) {
    throw error;
  }
};
