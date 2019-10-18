const { Photon } = require('@generated/photon')
const generate = require('nanoid/generate')
const { hashPassword } = require('../src/utils/hashPassword')

const photon = new Photon()

async function main() {
  let passwordHash1 = await hashPassword('red12345')
  const user1 = await photon.users.create({
    data: {
      email: 'johnni@example.com',
      name: 'johnni',
      password: passwordHash1,
      playercode: generate(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        10,
      ),
    },
  })
  let passwordHash2 = await hashPassword('red12345')
  const user2 = await photon.users.create({
    data: {
      email: 'andreas@example.com',
      name: 'andreas',
      password: passwordHash2,
      playercode: generate(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        10,
      ),
    },
  })

  const team1 = await photon.teams.create({
    data: {
      name: 'The Mad Crew',
      shortname: 'TMC',
      teamcode: generate(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        10,
      ),
      owner: { connect: { id: user1.id } },
      players: { connect: [{ id: user1.id }, { id: user2.id }] },
    },
  })

  const team2 = await photon.teams.create({
    data: {
      name: 'Pancakes',
      shortname: '🥞',
      teamcode: generate(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        10,
      ),
      owner: { connect: { id: user2.id } },
      players: { connect: { id: user2.id } },
    },
  })
  console.log(JSON.stringify({ user1, user2, team1 /*, team2*/ }, null, 4))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await photon.disconnect()
  })
