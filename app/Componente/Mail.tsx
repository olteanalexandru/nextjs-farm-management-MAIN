'use client'
export default function Mail() {
return (

<div className="input-group">
<input type="email" name="email" placeholder="Email" />
 <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Subscribe</button> 
</div>

);}