import app from '../src/app.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';



import { MontadoraFactory } from '../test/factories/MontadoraFactory.js';
import { clearDatabase } from '../test/utils/cleatDatabase.js';

describe('API de montadoras', () => {
    beforeEach(async () => {
        await MontadoraFactory.create('Toyota', 'Japão');

        vi.clearAllMocks();
    })

    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    })

    describe('Teste de montadora', () => {
        describe("Criação de montadora", ()=> {
            it('Deve criar uma montadora com sucesso.', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({ nome: 'Hyundai', pais: 'Coreia do Sul' });
    
                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('insertId');
            })
            it('Não deve criar uma montadora sem pais.', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({ nome: 'Hyundai', pais: '' });
    
                expect(response.status).toBe(500);
            })
            it('Não deve criar uma montadora sem nome.', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({ nome: '', pais: 'Coreia do Sul' });
    
                expect(response.status).toBe(500);
              
            })
        })
        describe("Listagem",()=>{
            it('Deve listar todas', async () => {
                const response = await request(app)
                    .get('/montadoras')
    
                expect(response.status).toBe(200)
            })
        })
        describe("Delete de montadora", ()=> {
            it('Deve deletar uma montadora', async () => {
    
                const montadora = await MontadoraFactory.create('Fiat', 'Itália')
    
                const response = await request(app)
                    .delete('/montadoras/' + montadora.id)
    
                expect(response.status).toBe(200)
            })
            it('Não pode deletar uma montadora sem informar o id', async () => {
                const response = await request(app)
                    .delete('/montadoras/'  )
    
                expect(response.status).toBe(404)
            })
            it('Não pode deletar uma montadora não existente', async ()=>{
                const montadora = await MontadoraFactory.create('Fiat', 'Itália')
    
                const response = await request(app)
                    .delete('/montadoras/' + montadora.id+1)
    
                expect(response.status).toBe(404)
            })
        })
        it('Deve atualizar uma montadora', async () => {

            const montadora = await MontadoraFactory.create('Fiat', 'Itália')

            const response = await request(app)
                .put('/montadoras?id=' + montadora.id)
                .send({
                    nome: 'Honda',
                    pais: 'Japão'
                })
                expect(response.status).toBe(200)
                expect(response.body.data).toHaveProperty('affectedRows')
        })
        it('Não atualizar uma montadora sem informar o nome novo', async () => {

            const montadora = await MontadoraFactory.create('Fiat', 'Itália')

            const response = await request(app)
                .put('/montadoras?id=' + montadora.id)
                .send({
                    nome: '',
                    pais: 'Japão'
                })
                expect(response.status).toBe(500)
        })
        it.only('Não atualizar uma montadora sem informar o pais novo', async () => {

            const montadora = await MontadoraFactory.create('Fiat', 'Itália')

            const response = await request(app)
                .put('/montadoras?id=' + montadora.id)
                .send({
                    nome: 'Honda',
                    pais: ''
                })
                expect(response.status).toBe(500)
        })
    })
})
