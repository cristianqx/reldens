/**
 *
 * Reldens - TeamMessageActions
 *
 */

const { TryTeamStart } = require('./message-actions/try-team-start');
const { TeamJoin } = require('./message-actions/team-join');
const { TeamLeave } = require('./message-actions/team-leave');
const { TeamsConst } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class TeamMessageActions
{

    constructor(props)
    {
        this.teamsPlugin = props.teamsPlugin;
    }

    async executeMessageActions(client, data, room, playerSchema)
    {
        if(!sc.hasOwn(data, 'act')){
            return false;
        }
        if(0 !== data.act.indexOf(TeamsConst.TEAM_PREF)){
            return false;
        }
        if(TeamsConst.ACTIONS.TEAM_INVITE === data.act){
            return await TryTeamStart.execute(client, data, room, playerSchema, this.teamsPlugin);
        }
        if(TeamsConst.ACTIONS.TEAM_ACCEPTED === data.act && '1' === data.value){
            return await TeamJoin.execute(client, data, room, playerSchema, this.teamsPlugin);
        }
        if(TeamsConst.ACTIONS.TEAM_ACCEPTED === data.act && '2' === data.value){
            let activePlayerSendingInvite = room.fetchActivePlayerById(data.id);
            if(false === activePlayerSendingInvite){
                Logger.error(
                    'Team invitation declined, player owner client not found.',
                    Object.keys(room.activePlayers),
                    data
                );
                return false;
            }
            let playerRejectingName = playerSchema.playerName;
            await this.teamsPlugin.events.emit('reldens.teamJoinInviteRejected', {
                activePlayerSendingInvite,
                playerRejectingName
            });
        }
        if(TeamsConst.ACTIONS.TEAM_LEAVE === data.act){
            return await TeamLeave.fromMessage(data, room, playerSchema, this.teamsPlugin);
        }
        if(TeamsConst.ACTIONS.TEAM_REMOVE === data.act){
            return await TeamLeave.fromMessage(data, room, playerSchema, this.teamsPlugin);
        }
    }

}

module.exports.TeamMessageActions = TeamMessageActions;
