import '../index.css'
import './Banner.css'
import { CiLollipop } from "react-icons/ci";
function BannerLeft()
{
    return(
        <>
        <div className="w-[4vw] h-screen bg-white fixed z-[9999999]">
        <div className='text-center '><CiLollipop /></div>
        </div>
        </>
    );
}
export default  BannerLeft;