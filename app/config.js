module.exports = {
  api      : {
    base       : 'https://8kdx6rx8h4.execute-api.us-east-1.amazonaws.com/prod/',
    categories : {
      limit : 0,
      url   : 'categorias'
    },
    markets    : {
      limit : 50,
      url   : 'sucursales'
    },
    products   : {
      limit : 100,
      url   : 'productos'
    }
  },
  database : {
    host     : 'localhost',
    user     : 'precios_user',
    password : 'precios_pass',
    name     : 'precios',
    engine   : 'mysql'
  }
};