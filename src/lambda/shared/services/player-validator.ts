import { getPlayer } from '../models/player';

export const playerValidator = async (
    playerId: string,
    playerSecret: string,
): Promise<boolean> => {
    const result = await getPlayer(playerId);
    return (result !== null && result.secret === playerSecret);
}
