/**
 *
 * Reldens - TeamLeave
 *
 */

const { TeamUpdatesHandler } = require('../team-updates-handler');
const { TeamsConst } = require('../../constants');
const { Logger, sc } = require('@reldens/utils');

class TeamLeave
{

    static async fromMessage(data, room, playerSchema, teamsPlugin)
    {
        await teamsPlugin.events.emit('reldens.teamLeave', {data, room, playerSchema, teamsPlugin});
        let singleRemoveId = sc.get(data, 'remove', false);
        if(TeamsConst.ACTIONS.TEAM_REMOVE === data.act){
            if(data.id !== playerSchema.player_id){
                Logger.error('Team remove failed, player "'+playerSchema.playerName+'" not allowed.');
                return false;
            }
            if(!singleRemoveId){
                Logger.error('Team remove failed, missing single remove ID.', data);
                return false;
            }
        }
        if(TeamsConst.ACTIONS.TEAM_LEAVE === data.act && !singleRemoveId && playerSchema.player_id !== data.id){
            singleRemoveId = playerSchema.player_id;
        }
        return await this.execute(room, playerSchema, teamsPlugin, singleRemoveId);
    }

    static async execute(room, playerSchema, teamsPlugin, singleRemoveId)
    {
        let teamId = playerSchema.currentTeam;
        if(!teamId){
            return false;
        }
        let currentTeam = teamsPlugin.teams[teamId];
        if(!currentTeam){
            Logger.error('Player "'+playerSchema.player_id+'" current team "'+teamId+'" not found.');
            playerSchema.currentTeam = false;
            return false;
        }
        // @NOTE: the way this works is by making the clients leave the team and then updating the remaining players.
        let playerIds = Object.keys(currentTeam.players);
        let isOwnerDisbanding = playerSchema.player_id === teamId && !singleRemoveId;
        let areLessPlayerThanRequired = 2 >= playerIds.length;
        let removeByKeys = isOwnerDisbanding || areLessPlayerThanRequired ? playerIds : [singleRemoveId];
        for(let playerId of removeByKeys){
            if(1 === currentTeam.clients[playerId]?.ref?.readyState){
                let sendUpdate = {
                    act: TeamsConst.ACTIONS.TEAM_LEFT,
                    id: currentTeam.owner.player_id,
                    listener: TeamsConst.KEY
                };
                await teamsPlugin.events.emit('reldens.teamLeaveBeforeSendUpdate', {
                    playerId,
                    sendUpdate,
                    currentTeam,
                    isOwnerDisbanding,
                    areLessPlayerThanRequired,
                    singleRemoveId,
                    room,
                    playerSchema,
                    teamsPlugin
                });
                currentTeam.clients[playerId].send('*', sendUpdate);
            }
            let leavingPlayerName = currentTeam.players[playerId].playerName;
            currentTeam.leave(currentTeam.players[playerId]);
            await teamsPlugin.events.emit('reldens.afterTeamLeave', {currentTeam, leavingPlayerName});
        }
        if(1 >= Object.keys(currentTeam.players).length){
            let event = {singleRemoveId, room, playerSchema, teamsPlugin, continueDisband: true};
            await teamsPlugin.events.emit('reldens.beforeTeamDisband', event);
            if(!event.continueDisband){
                return false;
            }
            delete teamsPlugin.teams[teamId];
            return true;
        }
        let event = {singleRemoveId, room, playerSchema, teamsPlugin, continueLeave: true};
        await teamsPlugin.events.emit('reldens.beforeTeamDisband', event);
        if(!event.continueLeave){
            return false;
        }
        return TeamUpdatesHandler.updateTeamPlayers(currentTeam);
    }

}

module.exports.TeamLeave = TeamLeave;
