import React, { useState } from "react";
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StoreProps {
    onClose: () => void;
    setCoins: React.Dispatch<React.SetStateAction<number>>;
    setGems: React.Dispatch<React.SetStateAction<number>>;
    setEquippedSkin: (skin: any) => void;
    setEquippedBoard: (board: any) => void;
    coins: number;
    gems: number;
}

type Category = "currency" | "skins" | "boards";

export default function Store({ onClose, setCoins, setGems, setEquippedSkin, setEquippedBoard, coins, gems }: StoreProps) {
    const stripe = useStripe();
    const elements = useElements();
    
    
    const [category, setCategory] = useState<Category>("currency");
    const [paymentStep, setPaymentStep] = useState<"browse" | "checkout">("browse");
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [previewItem, setPreviewItem] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState<{ msg: string; success: boolean } | null>(null);

    const packs = {
        currency: [
            { id: "c1", type: "cash", amount: 5000, price: 0.99, icon: "🪙", name: "Pouch of Coins", reward: "coin" },
            { id: "g1", type: "cash", amount: 100, price: 4.99, icon: "💎", name: "Gem Pile", reward: "gem" },
        ],
        skins: [
            { id: "s1", type: "ingame", price: 1000, currency: "coin", name: "Neon Pulse", x: "⚡", o: "🌀", color: "#00f3ff" },
            { id: "s2", type: "ingame", price: 30, currency: "gem", name: "Royal Gold", x: "⚜️", o: "👑", color: "#ffd700" },
            { id: "classic", type: "ingame", price: 0, currency: "coin", name: "Classic Neon", x: "X", o: "O", color: "#ff0055" },
        ],
        boards: [
            { id: "b0", type: "ingame", price: 0, currency: "coin", name: "Default Neon", theme: "standard-theme" },
            { id: "b1", type: "ingame", price: 2000, currency: "coin", name: "Cyber Grid", theme: "matrix-green" },
            { id: "b2", type: "ingame", price: 3, currency: "gem", name: "Void Arena", theme: "dark-matter" },
        ]
    };

    const handleInGamePurchase = (item: any) => {
        const currentBalance = item.currency === "coin" ? coins : gems;
        if (currentBalance < item.price) {
            setPurchaseStatus({ msg: "INSUFFICIENT FUNDS", success: false });
            return;
        }

        if (item.currency === "coin") setCoins(prev => prev - item.price);
        else setGems(prev => prev - item.price);

        if (item.x) {
            setEquippedSkin({ x: item.x, o: item.o, color: item.color, id: item.id });
            setPurchaseStatus({ msg: `${item.name.toUpperCase()} EQUIPPED!`, success: true });
        } else if (item.theme) {
            setEquippedBoard(item); 
            setPurchaseStatus({ msg: `${item.name.toUpperCase()} APPLIED!`, success: true });
        }
    };

    const handlePurchase = async () => {
        if (!stripe || !elements || !selectedItem) return;
        
        setIsProcessing(true);
        setIsVerifying(true);

        try {
            
            const response = await fetch("https://tictactoe-server-1-2tzt.onrender.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: [{ id: selectedItem.id }] })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Server connection failed");
            }

            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: { 
                    card: elements.getElement(CardElement)!,
                    billing_details: { name: 'Valued Player' }
                }
            });

            if (result.error) {
                setPurchaseStatus({ msg: result.error.message || "Payment Failed", success: false });
            } else if (result.paymentIntent?.status === 'succeeded') {
                if (selectedItem.reward === "coin") setCoins(p => p + selectedItem.amount);
                if (selectedItem.reward === "gem") setGems(p => p + selectedItem.amount);
                
                setPurchaseStatus({ msg: "SUCCESSFUL PURCHASE!", success: true });
                setPaymentStep("browse");
                setSelectedItem(null);
            }
        } catch (err: any) {
            console.error("Purchase Error:", err);
            setPurchaseStatus({ msg: err.message || "Network Error", success: false });
        } finally {
            setIsProcessing(false);
            setIsVerifying(false);
        }
    };

    return (
        <div className="modal-overlay store-backdrop">
            
            {purchaseStatus && (
                <div className="custom-alert-overlay">
                    <div className={`custom-alert-box ${purchaseStatus.success ? 'border-glow-blue' : 'border-glow-red'}`}>
                        <div className="status-icon">{purchaseStatus.success ? "✓" : "⚠"}</div>
                        <h3 className="alert-msg">{purchaseStatus.msg}</h3>
                        <button className="alert-close-btn" onClick={() => setPurchaseStatus(null)}>PROCEED</button>
                    </div>
                </div>
            )}

            
            {isVerifying && (
                <div className="secure-overlay">
                    <div className="spinner"></div>
                    <p>CONTACTING SECURE BANK...</p>
                    <small>Do not refresh the page</small>
                </div>
            )}

            <div className="store-card professional-upgrade">
                <div className="store-status">
                    <div className="stat">🪙 {coins.toLocaleString()}</div>
                    <div className="stat">💎 {gems.toLocaleString()}</div>
                    <button className="close-x" onClick={onClose}>×</button>
                </div>

                <h2 className="glow-text main-title">NEON MERCURY STORE</h2>

                {paymentStep === "browse" ? (
                    <>
                        <div className="store-tabs">
                            {(["currency", "skins", "boards"] as Category[]).map(tab => (
                                <button key={tab} className={`tab-btn ${category === tab ? "active" : ""}`} onClick={() => setCategory(tab)}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className={`store-preview-window ${previewItem ? 'active' : ''}`}>
                            {previewItem ? (
                                <>
                                    <p className="preview-label">PREVIEW: {previewItem.name}</p>
                                    <div className={`mini-board-preview ${previewItem.theme || ''}`}>
                                        <div className="mini-grid">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="mini-square">
                                                    {previewItem.x && i === 0 && <span style={{color: previewItem.color}}>{previewItem.x}</span>}
                                                    {previewItem.o && i === 1 && <span style={{color: previewItem.color}}>{previewItem.o}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="preview-placeholder">HOVER TO PREVIEW THEMES</p>
                            )}
                        </div>

                        <div className="items-grid">
                            {packs[category].map((item: any) => (
                                <div 
                                    key={item.id} 
                                    className="premium-item-card"
                                    onMouseEnter={() => setPreviewItem(item)} 
                                    onMouseLeave={() => setPreviewItem(null)} 
                                    onClick={() => {
                                        if (item.type === "cash") { 
                                            setSelectedItem(item); 
                                            setPaymentStep("checkout"); 
                                        } else { 
                                            handleInGamePurchase(item); 
                                        }
                                    }}
                                >
                                    <div className="item-visual">
                                        {category === "skins" ? (
                                            <span style={{ color: item.color }}>{item.x}{item.o}</span>
                                        ) : (
                                            item.icon || "🖼️"
                                        )}
                                    </div>
                                    <div className="item-name">{item.name}</div>
                                    <button className="buy-button">
                                        {item.type === "cash" ? `$${item.price}` : `${item.price} ${item.currency === 'gem' ? '💎' : '🪙'}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="checkout-container">
                        <button className="back-arrow" onClick={() => setPaymentStep("browse")}>← Back</button>
                        <div className="order-summary">
                            <span>Purchasing: <strong>{selectedItem?.name}</strong></span>
                            <span>Total: <strong>${selectedItem?.price}</strong></span>
                        </div>
                        <div className="stripe-input-container">
                            <CardElement options={{ 
                                style: { 
                                    base: { 
                                        fontSize: '16px', 
                                        color: '#fff',
                                        '::placeholder': { color: '#888' }
                                    } 
                                } 
                            }} />
                        </div>
                        <button 
                            className="confirm-pay-btn" 
                            onClick={handlePurchase} 
                            disabled={isProcessing || !stripe}
                        >
                            {isProcessing ? "ENCRYPTING..." : "CONFIRM SECURE PAYMENT"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}