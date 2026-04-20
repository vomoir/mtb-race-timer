import React, { useEffect, useState, useId } from 'react';
import { toast } from 'react-hot-toast';

// Replace with your actual Square Application and Location IDs
const APPLICATION_ID = 'REPLACE_WITH_SQUARE_APP_ID';
const LOCATION_ID = 'REPLACE_WITH_SQUARE_LOCATION_ID';

export const SquarePayment = ({ onPaymentSuccess, amount = 2500, label = "Event Activation" }) => {
  const [card, setCard] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!window.Square) {
      toast.error('Square SDK not loaded. Check your internet connection.');
      return;
    }

    const initializeSquare = async () => {
      try {
        const payments = window.Square.payments(APPLICATION_ID, LOCATION_ID);
        const cardElement = await payments.card();
        await cardElement.attach(`#card-container-${containerId}`);
        setCard(cardElement);
      } catch (e) {
        console.error('Square initialization failed', e);
      }
    };

    initializeSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, [containerId]);

  const handlePayment = async () => {
    if (!card) return;

    setIsProcessing(true);
    try {
      const result = await card.tokenize();
      if (result.status === 'OK') {
        // Send this token to your backend (Firebase Cloud Function)
        await onPaymentSuccess(result.token);
      } else {
        toast.error(result.errors[0].message);
      }
    } catch (e) {
      console.error('Payment tokenization failed', e);
      toast.error('Payment failed to initialize.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-blue-100 rounded-2xl bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-slate-800">{label}</h3>
        <span className="text-blue-600 font-black">${(amount / 100).toFixed(2)}</span>
      </div>
      
      <div id={`card-container-${containerId}`} className="min-h-[100px]"></div>
      
      <button
        onClick={handlePayment}
        disabled={isProcessing || !card}
        className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            PROCESSING...
          </>
        ) : (
          `PAY & START EVENT`
        )}
      </button>
      
      <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">
        Secure payment processed by Square
      </p>
    </div>
  );
};

export default SquarePayment;
