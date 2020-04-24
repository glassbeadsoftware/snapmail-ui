{ holonix }:
{
 buildInputs = [
 (holonix.pkgs.writeShellScriptBin "snapmail-ui"
 ''
 set -euxo pipefail
 ${holonix.pkgs.nodejs}/bin/npm start
 '')
 ];
}
