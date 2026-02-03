import "./ctabtn.css";

export default function CTAButton({ text = "audit" }) {
    const isInvest = text.toLowerCase() === "invest";

    return (
        <div className={`btn-wrapper ${isInvest ? 'invest-theme' : ''}`}>
            <div className="line horizontal top"></div>
            <div className="line vertical right"></div>
            <div className="line horizontal bottom"></div>
            <div className="line vertical left"></div>

            <div className="dot top left"></div>
            <div className="dot top right"></div>
            <div className="dot bottom right"></div>
            <div className="dot bottom left"></div>

            <button className={`btn ${isInvest ? 'invest-btn' : ''}`}>
                <span className="btn-text">{text}</span>
            </button>
        </div>
    )
}