js
const details = gsap.utils.toArray(".desktopContentSection:not(:first-child)")

const photos = gsap.utils.toArray(".desktopPhoto:not(:first-child)")

gsap.set(photos, {yPercent:101})

ScrollTrigger.create({
trigger:".gallery",
start:"top top",
end:"bottom bottom",
pin:".right"
})

details.forEach( (detail, index) => {
let headline = detail.querySelector("h1")
ScrollTrigger.create({
trigger:headline,
start:"top 80%",
end:"top 50%",
animation: gsap.to(photos[index], {yPercent:0}),
scrub:true,
markers:false
})
})
//

---

css
body {
background:#EEF4FF;
margin:0;
font-family:sans-serif;
color:#333;
}

.spacer {
width:100%;
height:50vh;
background:#ddd;
}

.gallery h1 {
font-size:clamp(2em, 4vw, 6em);
}

.gallery p {
font-size:clamp(1.4em, 2.5vw, 5em);
line-height:1.4;
}

.gallery {
display:flex;
}

.left {
/_ outline:2px solid red; _/
width:50%;
}

.right {
/_ outline:2px solid blue; _/
height:100vh;
width:50%;
display:flex;
flex-direction:column;
justify-content:center;
}

.desktopContent {
margin:auto;
width:80%;
}

.desktopContentSection {
/_ outline:2px solid green; _/
min-height:100vh;
display:flex;
flex-direction:column;
justify-content:center;
}

.desktopContentSection:nth-child(even) {
/_ background:#ccc; _/
}

.desktopPhotos {
width:40vw;
height:40vw;
border-radius:20px;
position:relative;
overflow:hidden;
box-shadow:4px 4px 4px rgba(0, 0, 0, 0.4);
}

.desktopPhoto {
position:absolute;
width:100%;
height:100%;
}

.red {
background: crimson;
}

.green {
background:MediumSeaGreen;
}

.blue {
background:dodgerblue;
}

.pink{
background:deepPink;
}

---

html

<div class="spacer"></div>
<div class="gallery">
  <div class="left">
    <div class="desktopContent">
      <div class="desktopContentSection">
        <h1>Red</h1>
        <p>Red is a color often associated with strong emotions such as passion, love, and anger. It's a bold and attention-grabbing color that can evoke feelings of excitement, warmth, and energy.</p>
      </div>
      <div class="desktopContentSection">
        <h1>Green</h1>
        <p>Green is a color that is often associated with nature, growth, and harmony. It is a calming and relaxing color that can evoke feelings of balance, stability, and freshness.</p>
      </div>
      <div class="desktopContentSection">
        <h1>Pink</h1>
        <p>Pink is a color that is often associated with femininity, romance, and sweetness. It is a softer and more delicate shade of red that can evoke feelings of warmth, love, and nurturing.</p>
        <p>Pink has also been associated with certain social causes, such as breast cancer awareness.In fashion, pink is often used in women's clothing to convey a sense of softness, innocence, and playfulness. Lighter shades of pink are often used in children's clothing and toys to appeal to a younger demographic. </p>

<p>The pink ribbon has become a symbol for the cause, and the color pink is often used in fundraising campaigns and events. Pink is also used in men's clothing, although it is less common, as it can be seen as a more unconventional choice.</p>

<p>Pink is also used to raise awareness for other causes such as domestic violence and bullying.</p>

<p>Overall, the usage of the color pink can vary widely depending on the context and the intended message. </p>
        
      </div>
      <div class="desktopContentSection">
        <h1>Blue</h1>
        <p>Blue is a color that is often associated with calmness, trust, and reliability. It is a peaceful and serene color that can evoke feelings of stability, security, and professionalism.</p>
        
<p>Blue is a cool and calming color that is often associated with the sky and the sea. It is a primary color and one of the most popular colors in design and fashion. Blue is a versatile color that can range from bright and bold to soft and subdued, and it can be used to convey a range of emotions and moods, from serenity and tranquility to power and confidence.</p>

<p>In design, blue is often used to create a sense of trust and reliability, making it a popular choice for logos and branding. It is also a popular choice for backgrounds and text, as it is easy on the eyes and provides a good contrast to other colors. Blue can be used in both modern and traditional designs, and it can be paired with a wide range of other colors to create different effects.</p>

<p>In fashion, blue is a classic and timeless color that is often used in denim, suits, and formal wear. It is a versatile color that can be dressed up or down, and it can be paired with a range of other colors and patterns to create different looks. Blue is also a popular choice for accessories, such as scarves, shoes, and handbags. Lighter shades of blue, such as baby blue and powder blue, are often used for baby clothes and bedding, while darker shades of blue, such as navy and royal blue, are popular for men's suits and business wear.</p>

<p>Overall, blue is a versatile and popular color that can be used in a variety of design and fashion applications. Its calming and trustworthy qualities make it a popular choice for branding and logos, while its versatility and timeless appeal make it a classic choice for fashion.</p>
      </div>
    </div>
  </div>

  <div class="right">

    <!-- mobile content -->

    <!-- desktop content -->

    <div class="desktopPhotos">
      <div class="desktopPhoto red"></div>
      <div class="desktopPhoto green"></div>
      <div class="desktopPhoto pink"></div>
      <div class="desktopPhoto blue"></div>
    </div>

  </div>
</div>

<div class="spacer"></div>
<div class="spacer"></div>
<div class="spacer"></div>

<!-- PINK Extra Copy

        <p>Pink has also been associated with certain social causes, such as breast cancer awareness.In fashion, pink is often used in women's clothing to convey a sense of softness, innocence, and playfulness. Lighter shades of pink are often used in children's clothing and toys to appeal to a younger demographic. </p>

<p>The pink ribbon has become a symbol for the cause, and the color pink is often used in fundraising campaigns and events. Pink is also used in men's clothing, although it is less common, as it can be seen as a more unconventional choice.</p>

<p>Pink is also used to raise awareness for other causes such as domestic violence and bullying.</p>

<p>Overall, the usage of the color pink can vary widely depending on the context and the intended message. </p>

-->

<!--  Blue Extra Copy

<p>Blue is a cool and calming color that is often associated with the sky and the sea. It is a primary color and one of the most popular colors in design and fashion. Blue is a versatile color that can range from bright and bold to soft and subdued, and it can be used to convey a range of emotions and moods, from serenity and tranquility to power and confidence.</p>

<p>In design, blue is often used to create a sense of trust and reliability, making it a popular choice for logos and branding. It is also a popular choice for backgrounds and text, as it is easy on the eyes and provides a good contrast to other colors. Blue can be used in both modern and traditional designs, and it can be paired with a wide range of other colors to create different effects.</p>

<p>In fashion, blue is a classic and timeless color that is often used in denim, suits, and formal wear. It is a versatile color that can be dressed up or down, and it can be paired with a range of other colors and patterns to create different looks. Blue is also a popular choice for accessories, such as scarves, shoes, and handbags. Lighter shades of blue, such as baby blue and powder blue, are often used for baby clothes and bedding, while darker shades of blue, such as navy and royal blue, are popular for men's suits and business wear.</p>

<p>Overall, blue is a versatile and popular color that can be used in a variety of design and fashion applications. Its calming and trustworthy qualities make it a popular choice for branding and logos, while its versatility and timeless appeal make it a classic choice for fashion.</p>

-->
