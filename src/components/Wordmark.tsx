import './Wordmark.css'

export default function Wordmark({ size = 'compact' }: { size?: 'compact' | 'large' }) {
  return (
    <span className={`wordmark wordmark--${size}`}>
      <span className="wordmark__given">Markian<span className="wordmark__period">.</span></span>
      <span className="wordmark__family">Mumba Mwangi</span>
    </span>
  )
}
