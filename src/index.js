const { GraphQLServer } = require('graphql-yoga')
const {
  makeSchema,
  objectType,
  inputObjectType,
  arg,
  stringArg,
} = require('nexus')
const { Photon } = require('@generated/photon')
const { nexusPrismaPlugin } = require('nexus-prisma')

const generate = require('nanoid/generate')
const bcrypt = require('bcryptjs')

const { hashPassword } = require('./utils/hashPassword')
const { getUserId } = require('./utils/getUserId')
const { generateToken } = require('./utils/generateToken')

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.email()
    t.model.team()
    t.model.ownTeam()
    t.model.playercode()
  },
})

const Team = objectType({
  name: 'Team',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.teamcode()
    t.model.points()
    t.model.owner()
    t.model.players()
  },
})

const AuthPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.string('token')
    t.field('user', { type: 'User' })
  },
})

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.crud.user({
      alias: 'user',
    })
    t.crud.users({
      alias: 'users',
    })
    t.crud.teams({
      alias: 'teams',
    })
  },
})

const CreateUserInput = inputObjectType({
  name: 'CreateUserInput',
  definition(t) {
    t.string('name')
    t.string('email')
    t.string('password')
  },
})

const CreateTeamInvitationInput = inputObjectType({
  name: 'CreateTeamInvitationInput',
  definition(t) {
    t.string('teamid'), t.string('playercode')
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.deleteOneTeam()
    t.crud.deleteOneUser()
    t.crud.createOneTeam()
    t.crud.updateOneUser()
    t.field('createUser', {
      type: 'AuthPayload',
      args: {
        data: arg({
          type: 'CreateUserInput',
        }),
      },
      resolve: async (parent, { data: { name, email, password } }, ctx) => {
        const passwordHash = await hashPassword(password)
        const user = await ctx.photon.users.create({
          data: {
            name,
            email,
            playercode: generate(
              '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
              10,
            ),
            password: passwordHash,
          },
        })
        return { token: generateToken(user.id), user }
      },
    })
    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: stringArg(),
        password: stringArg(),
      },
      resolve: async (parent, { email, password }, ctx) => {
        const user = await ctx.photon.users.findOne({
          where: {
            email,
          },
        })

        if (!user) {
          throw new Error('User/password wrong')
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
          throw new Error('User/password wrong')
        }

        return { token: generateToken(user.id), user }
      },
    })
    t.field('createTeam', {
      type: 'Team',
      args: {
        name: stringArg(),
        shortname: stringArg(),
      },
      resolve: async (parent, { name, shortname }, ctx) => {
        const userID = getUserId(ctx)
        return ctx.photon.teams.create({
          data: {
            name,
            shortname,
            teamcode: generate(
              '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
              10,
            ),
            owner: {
              connect: {
                id: userID,
              },
            },
            players: {
              connect: {
                id: userID,
              },
            },
          },
        })
      },
    })
    t.field('createTeamInvitation', {
      type: 'Team',
      args: {
        data: arg({ type: 'CreateTeamInvitationInput' }),
      },
      resolve: async (parent, { data: { teamid, playercode } }, ctx) => {
        const userId = getUserId(ctx)
        if (!userId) {
          throw new Error('Please login to create new team invitation')
        }

        const teamOwner = await ctx.photon.teams.findMany({
          where: {
            AND: [
              {
                owner: { id: userId },
              },
              { id: teamid },
            ],
          },
        })
        /*console.log(teamOwner);
         */
        if (!teamOwner) {
          throw new Error('Only team owner can invite player')
        }

        return ctx.photon.teamInvitations.create(
          /*prisma.mutation.createTeamInvitation*/
          {
            data: {
              player: {
                connect: {
                  playercode: playercode,
                },
              },
              team: {
                connect: {
                  id: teamid,
                },
              },
            },
          },
        )
      },
    })
  },
})

const photon = new Photon()

new GraphQLServer({
  schema: makeSchema({
    types: [
      Query,
      Mutation,
      User,
      Team,
      AuthPayload,
      CreateUserInput,
      CreateTeamInvitationInput,
    ],
    plugins: [nexusPrismaPlugin()],
  }),
  context: { photon },
}).start(() =>
  console.log(
    `🚀 Server ready at: http://localhost:4000\n⭐️ See sample queries: http://pris.ly/e/js/graphql#5-using-the-graphql-api`,
  ),
)

module.exports = { User, Team }
