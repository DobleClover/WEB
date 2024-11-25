export function createProductCard(props) {
    const { id, name, category, price, files, discount } = props;

    // Crear elementos
    const card = document.createElement("a");
    card.className = `card product_card ${discount ? "discount_card":""}`;
    card.href = `/product/${id}`;

    const imagesWrapper = document.createElement("div");
    imagesWrapper.className = "card_images_wrapper";

    const cardImage = document.createElement("div");
    cardImage.className = "card_image";

    const mainImageObj = files.find(file => file.mainImage) || files[0];
    const mainImage = document.createElement("img");
    mainImage.className = "card_main_image card_main_image_active";
    mainImage.src = mainImageObj ? `/img/product/${mainImageObj.filename}` : "";
    mainImage.alt = `Main image for ${name}`;

    const hoveredImage = document.createElement("img");
    hoveredImage.className = "card_alternative_image";
    hoveredImage.alt = "Alt Image";

    cardImage.appendChild(mainImage);
    cardImage.appendChild(hoveredImage);
    if (discount) {
        const saleTag = document.createElement("div");
        saleTag.className = "sale_tag";
        saleTag.textContent = "SALE";
        cardImage.appendChild(saleTag);
    }
    const otherImagesContainer = document.createElement("div");
    otherImagesContainer.className = "card_other_image";

    files.forEach(file => {
        if(file.mainImage)return
        const otherImage = document.createElement("img");
        otherImage.src = `/img/product/${file.filename}`;
        otherImage.alt = `Image for ${name}`;
        otherImagesContainer.appendChild(otherImage);
    });

    imagesWrapper.appendChild(cardImage);
    imagesWrapper.appendChild(otherImagesContainer);

    const cardInfo = document.createElement("div");
    cardInfo.className = "card_information";

    const cardHeader = document.createElement("div");
    cardHeader.className = "card_header product_card_name";
    cardHeader.textContent = name;

    const cardCategory = document.createElement("div");
    cardCategory.className = "card_desc product_card_category";
    cardCategory.textContent = category;

    const cardPrice = document.createElement("div");
    cardPrice.className = `card_price product_card_price`;
    cardPrice.textContent = `$${price.toLocaleString()}`;
    let discountedPrice;
    if(discount){
        discountedPrice = document.createElement("div");
        discountedPrice.className = `card_price product_card_price discount_price`;
        discountedPrice.textContent = `$${((discount+1)*price).toLocaleString()}`;
        cardPrice.textContent="";
        const originalPrice = document.createElement("span");
        originalPrice.className = "original_price";
        originalPrice.textContent = `$${price.toLocaleString()}`;
        cardPrice.appendChild(originalPrice); // Agregarlo junto al precio original
        // Crear el elemento para mostrar el porcentaje de descuento
        const discountInfo = document.createElement("span");
        discountInfo.className = "discount_info";
        discountInfo.textContent = ` ${discount*100}% OFF`;
        cardPrice.appendChild(discountInfo); // Agregarlo junto al precio original
    }
    cardInfo.appendChild(cardHeader);
    cardInfo.appendChild(cardCategory);
    cardInfo.appendChild(cardPrice);
    discount ? cardInfo.appendChild(discountedPrice):null;

    card.appendChild(imagesWrapper);
    card.appendChild(cardInfo);

    return card;
}