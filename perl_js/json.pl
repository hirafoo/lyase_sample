use strict;
use warnings;
use CGI;
use JSON::XS ();

my $q = CGI->new;
my $json = JSON::XS->new;
my @rand;

for (1..3) {
    push @rand, +{
        num => $_,
        rand_num => int(rand(time^$$)),
    };

}

print $q->header(-type => 'text/javascript'), $json->encode(\@rand);
