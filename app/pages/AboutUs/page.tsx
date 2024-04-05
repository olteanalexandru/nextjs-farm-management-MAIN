// import Mail from "../../Componente/Mail";
import Link from "next/link";

export default function AboutUs() {
  return (
    <div>
      <div id="background" className="jumbotron text-center" style={{ borderBottom: '1px darkgray dotted' }}>
        <h1>Agricultural Solutions Platform</h1>
        <h2>Driving Efficiency and Sustainability</h2>
      </div>
      <div className="container text-center border-colorat" style={{ marginBottom: '8rem' }}>
        <h2>Our Vision</h2>
        <br />
        <div className="row">
          <div className="col-sm-4">
            <h4>Crop Management</h4>
            <p>Precise monitoring and management tools for maximizing crop performance.</p>
          </div>
          <div className="col-sm-4">
            <h4>Support and Collaboration</h4>
            <p>Committed to providing top-notch support and fostering collaboration for users' success.</p>
          </div>

          <div className="col-sm-4">
            <h4>Comprehensive Tracking</h4>
            <p>Track and analyze every stage of your crops' lifecycle seamlessly.</p>
          </div>
        </div>
        <br /><br />
        <div className="row">
          <div className="col-sm-4">
            <h4>Robust Analytics</h4>
            <p>Suite of analytical instruments tailored to optimize agricultural processes.</p>
          </div>
          <div className="col-sm-4">
            <h4>Efficiency and Profitability</h4>
            <p>Engineered to enhance efficiency, reduce waste, and drive profitability for farmers.</p>
          </div>
          <div className="col-sm-4">
          <h4>Feel free to contact us</h4>
         
         
         <li className="nav-item nav-list">
             <Link href="/pages/contact" className="nav-link">
              Contact us form
             </Link>
           </li>
           </div>
        </div>
  
      </div>
 
    </div>
  );
}
