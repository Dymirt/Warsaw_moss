import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Map  from '/src/maps/Map'
import Banner from '/src/banner/Banner'
import BannerLeft from '/src/banner/BannerLeft'
import './App.css'
import './index.css'
function App() {
 

  return (
    <>
  <BannerLeft/>
  <Banner />
  <Map />
    </>
  )
}

export default App
