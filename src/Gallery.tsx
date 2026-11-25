import { useRef, useState } from "react";
import { gallery } from "./content";

export function Gallery() {
  const [active, setActive] = useState(gallery[0]);
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <section className="section wrap" id="gallery">
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {gallery.map((photo) => (
          <button key={photo.image} type="button" aria-label={`Enlarge ${photo.alt}`}
            onClick={() => { setActive(photo); dialog.current?.showModal(); }}>
            <img src={`/images/${photo.image}`} alt={photo.alt} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <dialog ref={dialog} aria-label="Photo preview">
        <form method="dialog"><button className="button outline">Close photo</button></form>
        <img src={`/images/${active.image}`} alt={active.alt} />
      </dialog>
    </section>
  );
}
