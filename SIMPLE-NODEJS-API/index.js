import express from "express";
import fs from "fs";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const readData = () => {
  try {
    const data = fs.readFileSync("./db.json");
    return JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync("./db.json", JSON.stringify(data, null, 2)); 
  } catch (error) {
    console.log(error);
  }
};




app.get("/",(req, res) => {
    res.send("api");
});

// Esta ruta es para ver las materias de pensum que son las de tecnico en ingenieria en computacion
app.get("/pensum", (req, res) =>{
const data= readData();
res.json(data.pensum);

});

// Ruta para ver todas las materias de Ingeniería
app.get('/ingenieria', (req, res) => {
  const data = readData();
  const materiasIngenieria = data.ingenieria;
  res.json({ materias: materiasIngenieria });
});


// ruta para consultar materias por ciclo de tecnico en ingenieria en computacion
app.get("/materias/ciclo/:numero", (req, res) => {
    const data = readData();
    const cicloNumero = parseInt(req.params.numero);

    const materiasEnCiclo = data.pensum.filter((materia) => materia.ciclo === cicloNumero);
  
    if (materiasEnCiclo.length === 0) {
    
      res.status(404).json({ message: 'No se encontraron materias para este ciclo.' });
    } else {
      res.json(materiasEnCiclo);
    }
  });
  


// ruta para consultar materias por ciclo de ingenieria 
  app.get("/materias/cicloi/:numero", (req, res) => {
    const data = readData();
    const cicloNumero = parseInt(req.params.numero);

    const materiasEnCiclo = data.ingenieria.filter((materia) => materia.cicloi === cicloNumero);
  
    if (materiasEnCiclo.length === 0) {
      res.status(404).json({ message: 'No se encontraron materias para este ciclo.' });
    } else {
      res.json(materiasEnCiclo);
    }
  });

  //ruta para consultar los prerequisitos de la materia con su codigo del tecnico en computacion
    app.get("/codigos", (req, res) => {
        const data = readData();
      
        const materiasConPrerrequisitos = data.pensum.map((materia) => ({
          codigo: materia.codigo,
          prerrequisitos: materia.prerrequisitos,
        }));
      
        res.json(materiasConPrerrequisitos);
      });
      
      
// ruta para colsultar los prerequisitos de la materia con su codigo de la ingenieria
    app.get("/codigoss", (req, res) => {
        const data = readData();
      
        const materiasConPrerrequisitos = data.ingenieria.map((materia) => ({
          codigo1: materia.codigo1,
          prerrequisitoss: materia.prerrequisitoss,
        }));
      
        res.json(materiasConPrerrequisitos);
      });



// Ruta para eliminar la inscripción de una materia por su código
app.delete('/eliminar-inscripcion/:codigoMateria', (req, res) => {
  const codigoMateria = req.params.codigoMateria;

  const data = readData();

  let materiaEncontrada = null;

  for (const carrera in data) {
    const materiasDisponibles = data[carrera];
    const materia = materiasDisponibles.find((m) => m.codigo === codigoMateria);

    if (materia) {
      materiaEncontrada = materia;
      break; 
    }
  }

  if (!materiaEncontrada) {
    return res.status(404).json({ message: 'Materia no encontrada' });
  }

  if (!materiaEncontrada.inscrita) {
    return res.status(400).json({ message: 'La materia no está inscrita' });
  }

  materiaEncontrada.inscrita = false;

  data.materiasInscritas = data.materiasInscritas.filter((codigo) => codigo !== codigoMateria);

  writeData(data);

  return res.json({ message: 'Inscripción de materia eliminada exitosamente' });
});



// Ruta para inscribir varias materias a la vez
app.post('/inscribir-varias-materias/:carrera', (req, res) => {
  const carrera = req.params.carrera;
  const materiasSeleccionadas = req.body.materias;

  const data = readData();

  const uvInscritas = materiasSeleccionadas.reduce((totalUV, codigoMateria) => {
    const materiaEncontrada = buscarMateriaPorCodigo(data[carrera], codigoMateria);
    return totalUV + (materiaEncontrada ? materiaEncontrada.uv : 0);
  }, 0);

  let uvMaximasPorCarrera;
  if (carrera === 'pensum') {
    uvMaximasPorCarrera = 20; 
  } else if (carrera === 'ingenieria') {
    uvMaximasPorCarrera = 15; 
  }

  if (uvInscritas > uvMaximasPorCarrera) {
    return res.status(400).json({ message: `Las UV inscritas no deben ser mayor a ${uvMaximasPorCarrera}` });
  }

  for (const codigoMateria of materiasSeleccionadas) {
    const materiaEncontrada = buscarMateriaPorCodigo(data[carrera], codigoMateria);
    if (materiaEncontrada && !materiaEncontrada.inscrita) {
      materiaEncontrada.inscrita = true;
      data.materiasInscritas.push(codigoMateria);
    }
  }

  writeData(data);

  if (uvInscritas > uvMaximasPorCarrera) {
    return res.status(400).json({ message: `Las UV inscritas no deben ser mayor a ${uvMaximasPorCarrera}` });
  } else {
    return res.json({ message: 'Materias inscritas exitosamente' });
  }
});
function buscarMateriaPorCodigo(carreraData, codigoMateria) {
  const materia = carreraData.find((m) => m.codigo === codigoMateria || m.codigo1 === codigoMateria);
  return materia || null;
}

// ruta para mandar a llamar al servidor 
app.listen(3000, () =>{
    console.log('server conectado en el puerto 3000');
});

