import React from 'react';
import './Home.css';
import Navbar from '../../../partials/navbar/navbar';
import UserFooter from '../../../partials/UserFooter/UserFooter';

const Home = () => {
  return (
    <div className="us-page-wrapper">
      <Navbar/>

      <main className="us-main-content">
        {/* Hero / Banner Section */}
        <section className="us-hero-section">
          <div className="us-hero-left">
            <h1 className="us-hero-title">STEP INTO YOUR STYLE</h1>
            <p className="us-hero-subtitle">
              Elevate your journey with our meticulously curated collection of premium footwear. Where architectural precision meets unparalleled comfort, designed for those who move with purpose and define their own path.
            </p>
            <div className="us-hero-buttons">
              <a href="/shop" className="us-btn-primary">SHOP NOW</a>
              <a href="/explore" className="us-btn-secondary">EXPLORE NOW</a>
            </div>
          </div>
          <div className="us-hero-right">
            <img 
              src="https://i.pinimg.com/1200x/58/32/66/5832664eb06e24648ccf17e6abc2294e.jpg" 
              alt="Hero Sneaker" 
              className="us-hero-img"
              style={{ border: "2px solid grey" }}
            />
          </div>
        </section>

{/* Curated Categories Section */}
        <section className="us-categories-section">
          <div className="us-section-header">
            <h2>Curated Categories</h2>
          </div>
          <div className="us-categories-grid">
            <a href="/user/men" className="us-cat-card">
<img src="https://images.pexels.com/photos/13600672/pexels-photo-13600672.jpeg" alt="Black and White Sneaker Design" />            
  <div className="us-cat-overlay"></div>
              <h3>MEN'S</h3>
            </a>
            <div className="us-cat-right-grid">
                <a href="/user/women" className="us-cat-card">
                  <img src="https://i.pinimg.com/736x/2d/3c/73/2d3c73091097588ff92a2845af0b291a.jpg" alt="Sports" />
                  <div className="us-cat-overlay"></div>
                  <h3>WOMEN'S</h3>
                </a>
              <div className="us-cat-sub-grid">
                <a href="/sports" className="us-cat-card">
                  <img src="https://i.pinimg.com/736x/4d/e5/4c/4de54c2d3a291ff7a3e44b4df77f0354.jpg" alt="Sports" />
                  <div className="us-cat-overlay"></div>
                  <h3>EXPLORE</h3>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Brands Section */}
        <section className="us-brands-section">
          <div className="us-section-header center">
            <h2>Explore Our Brands</h2>
            <p>Shop your favorite styles from the world's most trusted footwear brands.</p>
          </div>
          <div className="us-brands-grid">
            <div className="us-brand-box"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmSlg1mvQcBHOGgXdgR3RXFxht9N9D6MnPDk-13zhbSDSqu4Arvp8ezDldEU4sL2MWdMBtkAeAZRB69jtag4EgZfbhw0Xdt0Sj4X2OJkQ9EDiH4fEPq9St7Ql1bJ_fOThQRCTjW-ziwIAAan5p-3Ay327x2PGuJNgrM0r0lKeZoWGS9FWjsfQWLVZP0w_QmqGVkzrOzk5u0sA3x7nkRaBCcCD3p8UISut6B6JKZWwwewY6Wr6tiA" alt="Nike" /></div>
            <div className="us-brand-box"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD3p-uaQoUTTVNN6Gx4yqPwpgJ_ZKoJCEXFMxJIIpHHaj7NaZ6EYlgTT2fC1x89NvD2_OjzLpUH7zRASeQNpLIYMkbjM1BgxQ6woCb-mrgdml1UXjw8vKuH4KQ2tMe48jBtf8ZiujSIgkcDtVir7W2oxElhy7zl5u5LRbh6IR6HrB7yAmxTH1_OvyE8VCUcAiE7GpV01FHjW2D5LKT11w5KBZ00jMWfMwBS9JPQCqgDy5lvDWjgw" alt="Skechers" /></div>
            <div className="us-brand-box"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMSmkdXeiggyKBBpSINF80-WU8dzALAPl8ivVgG911J-P11LUo5h9yX3gQ6ShLiazvcNkVu8Hfyy5W4KHw-Z2o0HhZnTVGidORf36DvmysvkmNk895B1h2CDQnBZPO3Iqf4PPIfyYIwQtWS7VRB8qS5ES4NfYa9RTaNWVAsYeLq9yyI-Y6PZDhdGqNdp-DD_oTiYSQE_5CiShO-gt-9gLDDSdkvjkpNKfl1Jw2ACD6ag1A5vyDyQ" alt="Puma" /></div>
            <div className="us-brand-box"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaJZU16dLpOuOPCJlPqIUlo7lKN1m6wbolo2mzP7NID34wv7DAjbKe4mwSkD23kdaEEAk0kk6KanIbAVfCJEClPkIx81AxfNUZCjrp2nJkCqMNYgIOfs4N-Vgvn_Rca2LcBflWZNmOkL11qdgoGvrTRxnAoSXi0_nFsGAcLPjEfKLXcQBEtWzNVvUwlAThFIlMqQ6Lh4F0R5awRJR2q2x0OAUBCdRpndMNSReGlbG9d8PavTsP2Q" alt="New Balance" /></div>
            <div className="us-brand-box"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQYXfXtkan9nV_DCP3IrxG38zX0rWZ7eYHTooETGvsOcRJeQPBoQhS9OZzlZmoT4rgQrXdw1uV0sWTfDl4dSUfyW2GS1GN7x8MN0La7LwPvSNESKgorijNGDnwkA2PB7asY4vpWpZ4BCwLEuIyVLkjMRsmU1kEh7hbMDRVBM6GeZwgBWy78-drQwT4flKEXeYo5Jspo0GSc6F3KTzQ-kk_6dyk50kuOaDl8qUiwvZpBaNzzC8Cyg" alt="Adidas" /></div>
          </div>
        </section>

        {/* Trending Now Section */}
        <section className="us-trending-section">
          <div className="us-section-header center">
            <h2>TRENDING NOW</h2>
            <p>Discover the most sought-after silhouettes defining global street culture right now.</p>
          </div>
          <div className="us-products-grid">
            <div className="us-product-card">
              <div className="us-product-img-box">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2oeqDI9-IPh8nLXbzk6o0mb78VbILyPqqPSHDajcyEMZ6PCKPfJyJQ6JrPx9YeLkj8yRjkM_sPFO7jchzHQjJ5YBA7iCdjSeGGBqtV1KFFe8D6yoAq5YAx_wp2J6eM-dC8a_YmidG2RghiWk8ZjIoAL50Xm7mMoSZcdwRBYbxoDRo-E2_7S1wRFEnRO7Tg7Ykr1kJ-H8wJr9KbAWwlr6cKbOBClJciMJTtKmZYks9pM_XxSAs_Q" alt="Adidas Samba OG" />
                <button className="us-card-fav"><span className="material-symbols-outlined">favorite</span></button>
              </div>
              <div className="us-product-info">
                <div className="us-product-title-price">
                  <h4>ADIDAS SAMBA OG</h4>
                  <span>₹8,499</span>
                </div>
                <p className="us-product-cat">CLASSIC TERRACE FAVORITE</p>
                <div className="us-rating">★★★★★ <span className="us-reviews">(124)</span></div>
              </div>
              <button className="us-add-cart-btn">ADD TO CART</button>
            </div>

            <div className="us-product-card">
              <div className="us-product-img-box">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAw49hZth0Mm3NlwBk30odxek0fXuDWMW9GjRNYAxz0EopXSYLI8DM7Cn2PO8FoUMR66uKOKaSnfKy3N0BjTce54j0vk3z67xivWyDuYQ22epBIaKyRJEjgDEB1Ocz0NartPVT9y1hMPYCAGXoWAflr3UUzSGDRjqaWuWTLD8wMMgeJjVTllROymaXbtqxRN8z0LnkncdifiIKlg4aZ9QGUZ4eno5DJbpxTTQ02-1JjLjFwBYlZQ" alt="New Balance 550" />
                <button className="us-card-fav"><span className="material-symbols-outlined">favorite</span></button>
              </div>
              <div className="us-product-info">
                <div className="us-product-title-price">
                  <h4>NEW BALANCE 550</h4>
                  <span>₹9,999</span>
                </div>
                <p className="us-product-cat">VINTAGE COURT STYLE</p>
                <div className="us-rating">★★★★☆ <span className="us-reviews">(89)</span></div>
              </div>
              <button className="us-add-cart-btn">ADD TO CART</button>
            </div>

            <div className="us-product-card">
              <div className="us-product-img-box">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvhDxfVNVWx1M2v6GJ0bB80kUzNyWE4zbwIQhIGuIa_zQBbFVxmebTwNOqJsP4yFTMPydXnQ-ugiJgSBpq4GYPcsCuidPZvwYbQ_WQO7wSL0g1cp3e5Cd6fRlNiNvTht0i70BK5HOxvKPBV_YqEvmPMR-GcBnGw3sAVy5Xcn62IEyBGzGik3skoeLl6brFRttg8CRY-RODVj4evj1xADnsFyt0PMiO62eglUHouTS5uMDm8u8JnQ" alt="Nike Dunk Low Panda" />
                <button className="us-card-fav"><span className="material-symbols-outlined">favorite</span></button>
              </div>
              <div className="us-product-info">
                <div className="us-product-title-price">
                  <h4>NIKE DUNK LOW PANDA</h4>
                  <span>₹10,499</span>
                </div>
                <p className="us-product-cat">EVERYDAY ESSENTIAL</p>
                <div className="us-rating">★★★★★ <span className="us-reviews">(2.1k)</span></div>
              </div>
              <button className="us-add-cart-btn">ADD TO CART</button>
            </div>

            <div className="us-product-card">
              <div className="us-product-img-box">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAioff5j22rAcF7U29DydGt7Vf9VMhgYNlIEoCXjDW3-7DI68-QNEcaLRTrAxU1EW4ZgTWrVIU8laPSqaA-sq7CnzW1ZYFXekiHvpZz6_zbFdODHSt0xx4ls08kdavjPgQbhm0wzQDUlgElKGU8zSUAMmFi4xRdSODSh6SqY-hs5QwotU1GQzo_Qc_wsf2BdP88ILOATZRVwQcvtBjKx9eptpL4RPtJtFEmYatp3dmHRw946m3I3w" alt="Asics Gel-Kayano 14" />
                <button className="us-card-fav"><span className="material-symbols-outlined">favorite</span></button>
              </div>
              <div className="us-product-info">
                <div className="us-product-title-price">
                  <h4>ASICS GEL-KAYANO 14</h4>
                  <span>₹11,999</span>
                </div>
                <p className="us-product-cat">TECHNICAL RUNNER AESTHETIC</p>
                <div className="us-rating">★★★★★ <span className="us-reviews">(560)</span></div>
              </div>
              <button className="us-add-cart-btn">ADD TO CART</button>
            </div>
          </div>
        </section>

        {/* Where Architecture Meets Motion Section (Fixed Images) */}
        <section className="us-editorial-section">
          <div className="us-editorial-header">
            <span className="us-editorial-tag">EDITORIAL CAMPAIGN • EDITION 2024 / ARCHIVE</span>
            <h2>WHERE ARCHITECTURE MEETS MOTION</h2>
            <p>Explorations in brutalist geometry, premium ergonomics, and all-day metropolitan cadence.</p>
          </div>
          <div className="us-specs-bar">
            <span>[ SPEC 01: VIBRAM® TRACTION ]</span>
            <span>[ SPEC 02: CALF-GRAIN LEATHER ]</span>
            <span>[ SPEC 03: DUAL-DENSITY FOAM ]</span>
            <span className="us-spec-coords">[ 52.5200° N, 13.4050° E ]</span>
          </div>
          <div className="us-editorial-grid">
            <div className="us-editorial-card">
              <div className="us-editorial-img-wrap">
                <img src="https://i.pinimg.com/1200x/7f/88/de/7f88defeff341c5eb9039ae12d1057e5.jpg" alt="The Brutalist Runner" />
                <div className="us-editorial-badge">SERIES 01 // FORM & STRUCTURE</div>
              </div>
              <h3>THE BRUTALIST RUNNER</h3>
              <p>Sculpted off-white leather with obsidian accents, engineered for architectural stability.</p>
           
            </div>

            <div className="us-editorial-card">
              <div className="us-editorial-img-wrap">
                <img src="https://i.pinimg.com/1200x/23/d7/25/23d725cf1e771219f523810361cda04c.jpg" alt="Urban Movement" />
                <div className="us-editorial-badge">SERIES 02 // METROPOLITAN KINETICS</div>
              </div>
              <h3>URBAN MOVEMENT</h3>
              <p>Dynamic street-level ergonomics crafted for uninterrupted city traversal.</p>
            
            </div>
          </div>
        </section>
      </main>

      <UserFooter />
    </div>
  );
};

export default Home;