import * as React from "react";
import { cn } from "@/lib/utils";

// --- PROPS INTERFACE ---
// Defines the types for the props that the component accepts.
// This ensures type safety and provides clear documentation.
interface FlippableCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}

const FlippableCreditCard = React.forwardRef<HTMLDivElement, FlippableCreditCardProps>(
    ({ className, cardholderName, cardNumber, expiryDate, cvv, ...props }, ref) => {
        return (
            // The main container uses `group` to control the flip effect on hover.
            // `perspective` is used to create the 3D effect.
            <div
                className={cn("group h-40 w-64 [perspective:1000px]", className)}
                ref={ref}
                {...props}
            >
                {/* The inner container handles the transform animation. */}
                <div
                    className={cn(
                        "relative h-full w-full rounded-xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d]",
                        !props.id?.includes('locked') && "group-hover:[transform:rotateY(180deg)]"
                    )}
                >

                    {/* --- CARD FRONT --- */}
                    <div className="absolute h-full w-full rounded-xl bg-[#1c1c1c] border border-slate-700/50 text-white [backface-visibility:hidden]">
                        <div className="relative flex h-full flex-col justify-between p-4">
                            {/* Card Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400">ZENWALLET</span>
                                    <span className="text-[7px] font-bold text-blue-500/80">SANDBOX NODE</span>
                                </div>
                                <svg
                                    className="h-9 w-9"
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0px"
                                    y="0px"
                                    viewBox="0 0 50 50"
                                >
                                    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB6VBMVEUAAACNcTiVeUKVeUOYfEaafEeUeUSYfEWZfEaykleyklaXe0SWekSZZjOYfEWYe0WXfUWXe0WcgEicfkiXe0SVekSXekSWekKYe0a9nF67m12ZfUWUeEaXfESVekOdgEmVeUWWekSniU+VeUKVeUOrjFKYfEWliE6WeESZe0GSe0WYfES7ml2Xe0WXeESUeEOWfEWcf0eWfESXe0SXfEWYekSVeUKXfEWxklawkVaZfEWWekOUekOWekSYfESZe0eXekWYfEWZe0WZe0eVeUSWeETAnmDCoWLJpmbxy4P1zoXwyoLIpWbjvXjivnjgu3bfu3beunWvkFWxkle/nmDivXiWekTnwXvkwHrCoWOuj1SXe0TEo2TDo2PlwHratnKZfEbQrWvPrWua fUfbt3PJp2agg0v0zYX0zYSfgkvKp2frxX7mwHrlv3rsxn/yzIPgvHfduXWXe0XuyIDzzISsjVO1lVm0lFitjVPzzIPqxX7duna0lVncuHTLqGjvyIHeuXXxyYGZfUayk1iyk1e2lln1zYTEomO2llrb tnOafkjFpGSbfkfZtXLhvHfkv3nqxH3mwXujhU3KqWizlFilh06khk2fgkqsjlPHpWXJp2erjVOhg0yWe0SliE+XekShhEvAn2D///+gx8TWAAAARnRSTlMACVCTtsRl7Pv7+vxkBab7pZv5+ZlL/UnU/f3SJCVe+Fx39naA9/75XSMh0/3SSkia+pil/KRj7Pr662JPkrbP7OLQ0JFOijI1MwAAAAFiS0dEorDd34wAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IDx2lsiuJAAACLElEQVRIx2NgGAXkAUYmZhZWPICFmYkRVQcbOwenmzse4MbFzc6DpIGXj8PD04sA8PbhF+CFaxEU8iWkAQT8hEVgOkTF/InR4eUVICYO1SIhCRMLDAoKDvFDVhUaEhwUFAjjSUlDdMiEhcOEItzdI6OiYxA6YqODIt3dI2DcuDBZsBY5eVTr4xMSYcyk5BRUOXkFsBZFJTQnp6alQxgZmVloUkrKYC0qqmji2WE5EEZuWB6alKoKdi35YQUQRkFYPpFaCouKIYzi6EDitJSUlsGY5RWVRGjJLyxNy4ZxqtIqqvOxaVELQwZFZdkIJVU1RSiSalAt6rUwUBdWG1CP6pT6gNqwOrgCdQyHNYR5YQFhDXj8MiK1IAeyN6aORiyBjByVTc0FqBoKWpqwRCVSgilOaY2OaUPw29qjOzqLvTAchpos47u6EZyYnngUSRwpuTe6D+6qaFQdOPNLRzOM1dzhRZyW+CZouHk3dWLXglFcFIflQhj9YWjJGlZcaKAVSvjyPrRQ0oQVKDAQHlYFYUwIm4gqExGmBSkutaVQJeomwViTJqPK6OhCy2Q9sQBk8cY0DxjTJw0lAQWK6cOKfgNhpKK7ZMpUeF3jPa28BCETamiEqJKM+X1gxvWXpoUjVIVPnwErw71nmpgiqiQGBjNzbgs3j1nus+fMndc+Cwm0T52/oNR9lsdCS24ra7Tq1cbWjpXV3sHRCb1idXZ0sGdltXNxRateRwHRAACYHutzk/2I5QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QwODoxNToyOSswMDowMEUnN7UAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMDg6MTU6MjkrMDA6MDA0eo8JAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAyLTEzVDA4OjE1OjI5KzAwOjAwY2+u1gAAAABJRU5ErkJggg==" />
                                </svg>
                                <p className="font-bold tracking-widest text-[10px] text-slate-500 uppercase">MASTERCARD</p>
                            </div>

                            {/* Card Number */}
                            <div className="text-center font-mono text-sm tracking-[0.15em] text-slate-200 whitespace-nowrap">
                                {cardNumber}
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-end justify-between">
                                <div className="text-left">
                                    <p className="text-[7px] font-bold uppercase text-slate-600 tracking-widest">Card Holder</p>
                                    <p className="font-mono text-[10px] font-medium text-slate-300">{cardholderName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[7px] font-bold uppercase text-slate-600 tracking-widest">Expires</p>
                                    <p className="font-mono text-[10px] font-medium text-slate-300">{expiryDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CARD BACK --- */}
                    <div className="absolute h-full w-full rounded-xl bg-[#1c1c1c] border border-slate-700/50 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="flex h-full flex-col">
                            {/* Magnetic Strip */}
                            <div className="mt-6 h-8 w-full bg-neutral-900" />
                            {/* CVV Section */}
                            <div className="mx-4 mt-4 flex justify-end">
                                <div className="flex h-7 w-full items-center justify-end rounded-md bg-neutral-800 pr-4 border border-slate-700">
                                    <p className="font-mono text-xs text-white">{cvv}</p>
                                </div>
                            </div>
                            <p className="self-end pr-4 text-[7px] font-bold uppercase text-slate-600 mt-1">CVV / CVC</p>

                            {/* Signature Logo */}
                            <div className="mt-auto p-4 text-right flex justify-between items-end">
                                <span className="text-[6px] text-zinc-600 w-1/2 leading-tight text-left">
                                    This virtual node is used for secure Sandbox transaction validation.
                                </span>
                                <svg
                                    className="h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 48 48"
                                >
                                    <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
                                    <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
                                    <path
                                        fill="#ff3d00"
                                        d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
FlippableCreditCard.displayName = "FlippableCreditCard";

export { FlippableCreditCard };
