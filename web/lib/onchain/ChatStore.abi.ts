export const ChatStoreAbi = [
  {"type":"event","name":"MessageAppended","inputs":[
    {"name":"chatId","type":"bytes32","indexed":true},
    {"name":"author","type":"address","indexed":true},
    {"name":"timestamp","type":"uint64","indexed":false},
    {"name":"content","type":"bytes","indexed":false}
  ],"anonymous":false},
  {"type":"function","name":"append","stateMutability":"nonpayable","inputs":[
    {"name":"chatId","type":"bytes32"},{"name":"content","type":"bytes"}],"outputs":[]},
  {"type":"function","name":"count","stateMutability":"view","inputs":[
    {"name":"chatId","type":"bytes32"}],"outputs":[{"type":"uint256"}]},
  {"type":"function","name":"getRange","stateMutability":"view","inputs":[
    {"name":"chatId","type":"bytes32"},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"}],
    "outputs":[{"type":"address[]"},{"type":"uint64[]"},{"type":"bytes[]"}]}
] as const
