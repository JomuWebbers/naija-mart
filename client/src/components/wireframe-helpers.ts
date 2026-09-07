
export const fmt = (n: number) => `₦${n.toLocaleString()}`
export const pct = (price: number, orig: number) => Math.round((1 - price / orig) * 100)



