const IMAGES = [
  ['classroom', 'Schoolchildren in green uniforms raising their hands in class'],
  ['walking', 'Pupils in blue uniforms walking to school'],
  ['joy', 'Children in yellow and green jumping with joy on a hilltop'],
]

export default function Gallery() {
  return (
    <div className="gallery">
      {IMAGES.map(([n, a]) => <img key={n} src={`/images/${n}.jpg`} alt={a} loading="lazy" />)}
    </div>
  )
}
