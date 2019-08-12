import React, { useState } from 'react';
import './Login.css';
import logo from '../assets/logo.svg';
import api from '../services/api';

export default function Login({ history }){
    const [ userName, setUserName ] = useState('');

    async function handleSubmit(e){
        e.preventDefault();
        const response = await api.post('/devs', {
            username: userName
        }); 

        const { _id } = response.data;
        
        history.push(`/dev/${_id}`);
    }

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <img src={logo} alt="tindev"/>
                <input 
                    placeholder="Digite seu usuário do Github"
                    value={userName}
                    onChange={ e => setUserName(e.target.value)} 
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}