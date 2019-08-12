const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/user')


const router = express.Router();

router.use(authMiddleware);

router.get('/', async (request, response) => {
    try{
        const projects = await Project.find().populate([ 'user', 'tasks' ]);
        return response.send({ projects });
    }catch(err){
        return response.status(400).send({ error: 'Error loading projects' });
    }
});

router.get('/:projectId', async (request, response) =>{
    try{
        const id = request.params.projectId;
        const project = await Project.findById(id).populate('user');
        return response.send({ project });
    }catch(err){
        return response.status(400).send({ error: 'Error loading project' });
    }
});

router.post('/', async (request, response) => {
    try{
        const { title, description, tasks } = request.body;
        const project = await Project.create({ title, description, user: request.userId });

        await Promise.all(
            tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });
            
            await projectTask.save();
            project.tasks.push(projectTask);
        }));
        
        await project.save();
        return response.send({ project });
    }catch(err){
        return response.status(400).send({ error: 'Error on create a new project' });
    }
});

router.put('/:projectId', async(request, response) => {
    try{
        const id = request.params.projectId;
        const { title, description, tasks } = request.body;
        const project = await Project.findByIdAndUpdate(id, {
            title, 
            description
        }, { new: true});

        project.tasks = [];
        await Task.remove({ project: project._id });

        await Promise.all(
            tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });
            
            await projectTask.save();
            project.tasks.push(projectTask);
        }));
        
        await project.save();
        return response.send({ project });
    }catch(err){
        return response.status(400).send({ error: 'Error on updating a new project' });
    }
});

router.delete('/:projectId', async(request, response) => {
    try{
        const id = request.params.projectId;
        await Project.findByIdAndRemove(id);
        return response.send('Project removed succesfully!');
    }catch(err){
        return response.status(400).send({ error: 'Error on deleting project' });
    }
});

module.exports = app => app.use('/projects', router);