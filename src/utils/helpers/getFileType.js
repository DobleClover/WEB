export default function (file) {
    const mimetype = file.mimetype;

    if (mimetype.startsWith("image/")) {
        return 1;
    } else if (mimetype.startsWith("video/")) {
        return 2;
    } else {
        return undefined;
    }
}