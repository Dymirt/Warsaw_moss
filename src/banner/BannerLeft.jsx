import '../index.css'
import './Banner.css'
import { CiLollipop } from "react-icons/ci";
function BannerLeft()
{
    return(
        <>
        <div className="w-[4vw] h-screen bg-white fixed z-[9999999]">
        <div className='logoCont'><CiLollipop /></div>
        <h6 className='copyright'> ECONAVIGATE © 2024</h6>
        </div>
        </>
    );
}
export default  BannerLeft;