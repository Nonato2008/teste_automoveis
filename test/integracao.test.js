import app from '../src/app.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/consultarCep.js', () => ({
    consultarCep: async (cep) => {
        const cepLimpo = String(cep ?? '').replace(/\D+/g, '');
        if (cepLimpo.length !== 8) {
            throw new Error('CEP inválido');
        }

        return {
            cep: cepLimpo,
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            cidade: 'São Paulo',
            uf: 'SP'
        };
    }
}));

import { MontadoraFactory } from '../test/factories/MontadoraFactory.js';
import { clearDatabase } from '../test/utils/cleatDatabase.js';

const dadosCliente = {
    nome: 'João da Silva',
    cpf: '123.456.789-00',
    cep: '01001-000',
    numero: '100',
    complemento: 'Apto 10'
};

const dadosVeiculo = {
    modelo: 'Corolla',
    placa: 'ABC1234',
    ano: 2024,
    cor: 'Prata',
    valor: 150000
};

async function criarCliente() {
    const response = await request(app)
        .post('/clientes')
        .send(dadosCliente);

    return response.body.data.insertId;
}

describe('Teste de montadoras', () => {
    beforeEach(async () => {
        await MontadoraFactory.create('Toyota', 'Japão');

        vi.clearAllMocks();
    })

    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    })

    describe('Teste de montadora', () => {
        describe("Criação de montadora", () => {
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
        describe("Listagem", () => {
            it('Deve listar todas', async () => {
                const response = await request(app)
                    .get('/montadoras')

                expect(response.status).toBe(200)
            })
        })
        describe("Delete de montadora", () => {
            it('Deve deletar uma montadora', async () => {

                const montadora = await MontadoraFactory.create('Fiat', 'Itália')

                const response = await request(app)
                    .delete('/montadoras/' + montadora.id)

                expect(response.status).toBe(200)
            })
            it('Não pode deletar uma montadora sem informar o id', async () => {
                const response = await request(app)
                    .delete('/montadoras/')

                expect(response.status).toBe(404)
            })
            it('Não pode deletar uma montadora não existente', async () => {
                const montadora = await MontadoraFactory.create('Fiat', 'Itália')

                const response = await request(app)
                    .delete('/montadoras/' + montadora.id + 1)

                expect(response.status).toBe(404)
            })
        })
        describe('Atualização de montadora', () => {
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
            it('Não atualizar uma montadora sem informar o pais novo', async () => {

                const montadora = await MontadoraFactory.create('Fiat', 'Itália')

                const response = await request(app)
                    .put('/montadoras?id=' + montadora.id)
                    .send({
                        nome: 'Honda',
                        pais: ''
                    })
                expect(response.status).toBe(500)
            })
        });

    })
});

describe('Teste  de clientes', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    describe('Criação de cliente', () => {
        it('Deve criar um cliente com sucesso.', async () => {
            const response = await request(app)
                .post('/clientes')
                .send(dadosCliente);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('insertId');
        });

        it('Não deve criar um cliente sem nome.', async () => {
            const response = await request(app)
                .post('/clientes')
                .send({ ...dadosCliente, nome: '' });

            expect(response.status).toBe(500);
        });

        it('Não deve criar um cliente com CEP inválido.', async () => {
            const response = await request(app)
                .post('/clientes')
                .send({ ...dadosCliente, cep: '' });

            expect(response.status).toBe(500);
        });
    });

    describe('Listagem de clientes', () => {
        it('Deve listar os clientes cadastrados.', async () => {
            const idCliente = await criarCliente();
            const response = await request(app).get('/clientes');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        Id: idCliente,
                        Nome: dadosCliente.nome,
                        CPF: '12345678900'
                    })
                ])
            );
        });
    });

    describe('Atualização de cliente', () => {
        it('Deve atualizar um cliente.', async () => {
            const idCliente = await criarCliente();
            const dadosAtualizados = {
                ...dadosCliente,
                nome: 'Maria da Silva',
                cpf: '987.654.321-00',
                numero: '200'
            };

            const response = await request(app)
                .put(`/clientes?id=${idCliente}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('affectedRows', 1);

            const listagem = await request(app).get('/clientes');
            expect(listagem.body.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        Id: idCliente,
                        Nome: dadosAtualizados.nome,
                        CPF: '98765432100',
                        Numero: dadosAtualizados.numero
                    })
                ])
            );
        });

        it('Não deve atualizar um cliente sem nome.', async () => {
            const idCliente = await criarCliente();
            const response = await request(app)
                .put(`/clientes?id=${idCliente}`)
                .send({ ...dadosCliente, nome: '' });

            expect(response.status).toBe(500);
        });
    });

    describe('Exclusão de cliente', () => {
        it('Deve excluir um cliente.', async () => {
            const idCliente = await criarCliente();
            const response = await request(app).delete(`/clientes/${idCliente}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('affectedRows', 1);

            const listagem = await request(app).get('/clientes');
            expect(listagem.body.data).not.toEqual(
                expect.arrayContaining([expect.objectContaining({ Id: idCliente })])
            );
        });
    });
});

describe('Teste de veículos', () => {
    let idMontadora;
    let idCliente;

    beforeEach(async () => {
        await clearDatabase();

        const montadora = await request(app)
            .post('/montadoras')
            .send({ nome: 'Toyota', pais: 'Japão' });
        idMontadora = montadora.body.data.insertId;
        idCliente = await criarCliente();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    async function criarVeiculo() {
        return request(app)
            .post('/veiculos')
            .send({ ...dadosVeiculo, idMontadora, idCliente });
    }

    describe('Criação de veículo', () => {
        it('Deve criar um veículo com sucesso.', async () => {
            const response = await criarVeiculo();

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('insertId');
        });

        it('Não deve criar um veículo com modelo inválido.', async () => {
            const response = await request(app)
                .post('/veiculos')
                .send({ ...dadosVeiculo, modelo: '', idMontadora, idCliente });

            expect(response.status).toBe(500);
        });
    });

    describe('Listagem de veículos', () => {
        it('Deve listar os veículos cadastrados.', async () => {
            const criado = await criarVeiculo();
            const response = await request(app).get('/veiculos');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        Id: criado.body.data.insertId,
                        Modelo: dadosVeiculo.modelo,
                        Montadora: 'Toyota',
                        Cliente: dadosCliente.nome
                    })
                ])
            );
        });
    });

    describe('Atualização de veículo', () => {
        it('Deve atualizar um veículo.', async () => {
            const criado = await criarVeiculo();
            const dadosAtualizados = {
                ...dadosVeiculo,
                modelo: 'Corolla Cross',
                placa: 'DEF5678',
                ano: 2025,
                cor: 'Preto',
                valor: 180000,
                idMontadora,
                idCliente
            };

            const response = await request(app)
                .put(`/veiculos?id=${criado.body.data.insertId}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('affectedRows', 1);

            const listagem = await request(app).get('/veiculos');
            expect(listagem.body.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        Modelo: dadosAtualizados.modelo,
                        Placa: dadosAtualizados.placa,
                        Cor: dadosAtualizados.cor
                    })
                ])
            );
        });

        it('Não deve atualizar um veículo com modelo inválido.', async () => {
            const criado = await criarVeiculo();
            const response = await request(app)
                .put(`/veiculos?id=${criado.body.data.insertId}`)
                .send({ ...dadosVeiculo, modelo: '', idMontadora, idCliente });

            expect(response.status).toBe(500);
        });
    });

    describe('Exclusão de veículo', () => {
        it('Deve excluir um veículo.', async () => {
            const criado = await criarVeiculo();
            const idVeiculo = criado.body.data.insertId;
            const response = await request(app).delete(`/veiculos/${idVeiculo}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('affectedRows', 1);

            const listagem = await request(app).get('/veiculos');
            expect(listagem.body.data).not.toEqual(
                expect.arrayContaining([expect.objectContaining({ Id: idVeiculo })])
            );
        });
    });
});