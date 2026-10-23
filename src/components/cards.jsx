function Card ({pokemon, OnEdit, OnDelete}) {
   return (
        <div className="card"
        {pokemon.image.url && (
            <img src={default.jpg} alt ={pokemon.name} />
        ))
        <h3>{pokemon.name}</h3>
        <p>Type: {pokemon </p>



   )
}