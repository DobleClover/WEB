export function createProductCard(props) {
    const { id, name, category, price, files } = props;

    // Crear elementos
    const card = document.createElement("a");
    card.className = "card product_card";
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
    hoveredImage.className = "card_hovered_image";
    hoveredImage.alt = "Hovered Image";

    cardImage.appendChild(mainImage);
    cardImage.appendChild(hoveredImage);

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
    cardPrice.className = "card_price product_card_price";
    cardPrice.textContent = `$${price.toLocaleString()}`;

    const button = document.createElement("div");
    button.className = "ui button";
    button.textContent = "Seleccionar opciones";

    cardInfo.appendChild(cardHeader);
    cardInfo.appendChild(cardCategory);
    cardInfo.appendChild(cardPrice);
    cardInfo.appendChild(button);

    card.appendChild(imagesWrapper);
    card.appendChild(cardInfo);

    return card;
}