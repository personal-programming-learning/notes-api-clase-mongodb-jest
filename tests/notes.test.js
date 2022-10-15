const mongoose = require('mongoose');
const supertest = require('supertest');

const {app, server} = require('../index');
const Note = require('../models/Note');
const { initialNotes } = require('../tests/helpers');

const api = supertest(app);

describe('notes', () =>{

  // Antes de que se ejecuten los tests
  beforeEach(async() => {
    await Note.deleteMany({});

    for(const note of initialNotes) {
      const noteObject = new Note(note);
      await noteObject.save();
    }

  })

  test('are returned as json', async() => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  });

  test('there are two notes', async() => {
    const response = await api.get('/api/notes');
    expect(response.body).toHaveLength(initialNotes.length);
  });
  
  test('the first note is about midudev', async() => {
    const response = await api.get('/api/notes');
    expect(response.body[0].content).toBe('Aprendiendo Fullstack con midudev');
  });

  test('the notes content about midudev', async() => {
    const response = await api.get('/api/notes');
    const contents = response.body.map(note => note.content)
    expect(contents).toContain('Aprendiendo Fullstack con midudev');
  });

  test('a valid note can be added', async() => {
    const newNote = {
      content: 'proximamente async/await',
      important: true,
    };

    await api
      .post('/api/notes')
      .send(newNote)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/notes');
    const contents = response.body.map(note => note.content);

    expect(response.body).toHaveLength(initialNotes.length + 1);
    expect(contents).toContain(newNote.content);
  });

  test('whithout content is not added', async() => {
    const newNote = {
      important: true,
    };

    await api
      .post('/api/notes')
      .send(newNote)
      .expect(400)

    const response = await api.get('/api/notes');

    expect(response.body).toHaveLength(initialNotes.length);
  });

  test('a note can be deleted', async() => {
    const response = await api.get('/api/notes');
    const { body: notes } = response;
    const noteToDelete = notes[0];

    await api
      .delete(`/api/notes/${noteToDelete.id}`)
      .expect(204);

    const response2 = await api.get('/api/notes');

    expect(response2.body).toHaveLength(initialNotes.length - 1);
    expect(response2.body[0].content).not.toContain(noteToDelete.content);
    
  });

  test('a note that do not exist can not be deleted', async() => {
    await api
      .delete(`/api/notes/1234534`)
      .expect(400);

    const response = await api.get('/api/notes');
    expect(response.body).toHaveLength(initialNotes.length);
    
  });

  // Despues de ejecutar los tests ejecutar
  afterAll(() =>{
    mongoose.connection.close();
    server.close();
  })
});