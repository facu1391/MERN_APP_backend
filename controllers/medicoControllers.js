import Medico from "../models/Medico.js";
import generarJWT from "../helpers/generarJWT.js";
import generarId from "../helpers/generarId.js";
import emailRegistro from "../helpers/email.Registro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async (req, res) => {
    const {email, nombre } = req.body;

    //Prevenir usuarios duplicados
    const exiteUsuario = await Medico.findOne({email})
    if(exiteUsuario) {
        const error = new Error('Usuario ya registrador');
        return res.status(400).json({msg: error.message});
    }    

    try {
        //Guardar un nuevo Medico
        const medico = new Medico(req.body);
        const medicoGuardado = await medico.save();

        //Enviar el email
        emailRegistro({
           email,
           nombre,
           token: medicoGuardado.token 
        })

        res.json(medicoGuardado);
    } catch (error) {
        console.log(error);
    }

};

const perfil =  (req, res) => {
    const { medico } = req;

    res.json(medico);
};

const confirmar = async (req, res) => {
    const { token } = req.params

    const usuarioConfirmar = await Medico.findOne({token})
    if(!usuarioConfirmar) {
        const error = new Error('Token no valido')
        return res.status(404).json({msg: error.message})
    }

    try {
        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true
        await usuarioConfirmar.save()

        res.json({msg: 'Usuario confirmado correctamente'});
    } catch (error) {
        console.log(error)
    }

}

const autenticar = async (req, res) => {
    const {email, password} = req.body

    //Comprobar si el usuario existen
    const usuario = await Medico.findOne({email})
    if(!usuario) {
        const error = new Error('El Usuario no existe');
        return res.status(404).json({msg: error.message})
    }

    //Comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        const error = new Error('Tu cuenta no ha sido confirmado')
        return res.status(403).json({msg: error.message})
    }

    //Revisar el passwords
    if(await usuario.comprobarPassword(password)) {
        //Autenticar
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario.id)
        });
    } else {
        const error = new Error('El Pasword es incorrecto')
        return res.status(403).json({msg: error.message})
    }

};

const olvidePassword = async (req, res) => {
    const { email } = req.body;
    
    const existeMedico = await Medico.findOne({ email });
    if(!existeMedico) {
        const error = new Error("El Usuario no existe");
        return res.status(400).json({ msg: error.message });
    }

    try {
        existeMedico.token = generarId()
        await existeMedico.save();

        //Enviar email con instrucciones
        emailOlvidePassword({
            email,
            nombre: existeMedico.nombre,
            token: existeMedico.token
        })

        res.json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error)
    }
};

const comprobarToken = async (req, res) => {
    const {token} = req.params;
    const tokenValido = await Medico.findOne({token});
    if(tokenValido) {
        //El token es valido el usuario existe
        res.json({msg: "Token valido y el usuario existe"});
    } else {
        const error = new Error("Token no valido");
        return res.status(400).json({msg: error.message});
    }
};

const nuevoPassword = async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;

    const medico = await Medico.findOne({token})
    if(!medico) {
        const error = new Error("Hubo un error");
        return res.status(400).json({msg: error.message});
    }

    try {
        medico.token = null;
        medico.password = password;
        await medico.save();
        res.json({msg: 'Password modificado correctamente'})
    } catch (error) {
        console.log(error);
    }
};

const actualizarPerfil = async (req, res) => {
    const medico = await Medico.findById(req.params.id);
    if(!medico) {
        const error = new Error('Hubo un error')
        return res.status(400).json({msg: error.message})
    }

    const { email } = req.body
    if(medico.email !== req.body.email) {
        const existeEmail = await Medico.findOne({email})
        if(existeEmail) {
            const error = new Error('Ese email ya esta en uso')
            return res.status(400).json({msg: error.message})
        }
    }

    try {
        medico.nombre = req.body.nombre;
        medico.email = req.body.email;
        medico.web = req.body.web;
        medico.telefono = req.body.telefono;

        const medicoActualizado = await medico.save()
        res.json(medicoActualizado)

    } catch (error) {
        console.log8(error);
    } 
}

const actualizarPassword = async (req, res) => {
    //Leer los datos
    const { id } = req.medico;
    const { pwd_actual, pwd_nuevo } = req.body;

    //Comprobar que el medico existe
    const medico = await Medico.findById(id);
    if(!medico) {
        const error = new Error('Hubo un error')
        return res.status(400).json({msg: error.message})
    }

    //Comprobar su password
    if (await medico.comprobarPassword(pwd_actual)) {
        //Almacenar el password
        medico.password = pwd_nuevo;
        await medico.save();
        res.json({msg: 'Password Almacenado Correctamente'});
    } else {
        const error = new Error('El Password Actual es Icorrecto')
        return res.status(400).json({msg: error.message})
    }

}

export { registrar, perfil, confirmar, autenticar, olvidePassword, comprobarToken, nuevoPassword, actualizarPerfil, actualizarPassword };